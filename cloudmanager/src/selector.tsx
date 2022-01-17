import { 
    FormControl, 
    Select,
    InputLabel,
    MenuItem,
    Button} from '@mui/material';
import { LatLngTuple } from 'leaflet';
import { useState } from 'react';
import { Cloud } from './App';

interface CloudSelectorProps {
    className: string;
    data: Cloud[];
    selectedProvider: string;
    userLocation: LatLngTuple | null[];
    markersToRender: Cloud[];
    setSelected: Function;
    setSelectedProvider: Function;
  }
interface DistanceProps {
    markersToRender: Cloud[];
    userLocation: LatLngTuple | null[];
}
type Coordinate = {
    lat: number;
    lon: number;
  };

function getDistanceBetweenTwoPoints(cord1: Coordinate, cord2: Coordinate) {
    // haversine formula to calculate distance between points
    if (cord1.lat === cord2.lat && cord1.lon === cord2.lon) {
      return 0;
    }
    const radlat1 = (Math.PI * cord1.lat) / 180;
    const radlat2 = (Math.PI * cord2.lat) / 180;
  
    const theta = cord1.lon - cord2.lon;
    const radtheta = (Math.PI * theta) / 180;
  
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  
    if (dist > 1) {
      dist = 1;
    }
  
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344; //convert miles to km
    
    return dist;
  }

  const Distance = (props: DistanceProps) => {
    const [userLatitude, userLongitude] = props.userLocation
    if (props.markersToRender.length !== 1 || !userLatitude || !userLongitude) {
        return null
    }
    const cloudToMeasureDistance = props.markersToRender[0]
    const cloudCoords: Coordinate = {
        lat:cloudToMeasureDistance.geo_latitude, 
        lon:cloudToMeasureDistance.geo_longitude
    }
    const userCoords: Coordinate = {lat:userLatitude, lon:userLongitude}
    const distanceBetweenUserSelected = getDistanceBetweenTwoPoints(cloudCoords, userCoords)
    const userReadableDistance = Math.round(distanceBetweenUserSelected)

    return (
        <div>
            {`Distance: ${userReadableDistance} km`}
        </div>
    )
  } 

export const CloudSelector = (props: CloudSelectorProps) => {
    const data = props.data
    const [selectedName, setSelectedName] = useState("")
    const handleChange = (event: any) => {
        const selected = data.filter((cloud: Cloud) => cloud.cloud_name === event.target.value)
        props.setSelected(selected)
        setSelectedName(event.target.value)
    }
    const clearSelection = () => {
        props.setSelected([])
        props.setSelectedProvider("")
        setSelectedName("")
    }
    const clearCloudSelection = () => {
        props.setSelected([])
        setSelectedName("")
    }
    const selectClosest = (clouds: Cloud[]) => {
        const [userLatitude, userLongitude] = props.userLocation
        if (!userLatitude || !userLongitude) {
            return null
        }
        const userCoords: Coordinate = {lat:userLatitude, lon:userLongitude}
        const addedDistance = clouds.map((cloud: Cloud): Cloud => {
            const cloudCoords: Coordinate = {
                lat:cloud.geo_latitude, 
                lon:cloud.geo_longitude
            }
            const distanceBetweenUserSelected = getDistanceBetweenTwoPoints(cloudCoords, userCoords)
            cloud.distance = distanceBetweenUserSelected;
            return cloud
        })
        const closest = addedDistance.sort(function(a: Cloud, b: Cloud): number {
            if (!a.distance) {
                return -1;
              }
            if (!b.distance) {
                return 1;
              }
            if (a.distance < b.distance) {
              return -1;
            }
            if (a.distance > b.distance) {
              return 1;
            }
            return 0;
          });
        props.setSelected([closest[0]])
        setSelectedName(closest[0].cloud_name)
    }
    const getProviders = () => {
        const data = props.data
        const providers = data.map((cloud: Cloud) => cloud.cloud_name.split("-")[0])
        const uniqProviders = [...new Set(providers)]
        return uniqProviders
    }
    const providers = getProviders()
    const handleProviderFilterChange = (event: any) => {
        props.setSelectedProvider(event.target.value)
    }
    const cloudSelectorValues = () => {
        if (!props.selectedProvider) {
            return data
        } else {
            return data.filter((cloud: Cloud) => cloud.cloud_name.startsWith(props.selectedProvider))
        }
    }
    const valueItems = cloudSelectorValues()
    return (
        <div style={{width:"700px"}}>
            <h1>
                Select your cloud provider
            </h1>
            <Button
            onClick={clearSelection}
            >
              Show all clouds
            </Button>
            <Button
            onClick={clearCloudSelection}
            >
              Show all clouds from selected provider
            </Button>
            <FormControl fullWidth>
                <InputLabel id="cloud-select-label">Cloud</InputLabel>
                <Select
                labelId="cloud-select-label"
                id="cloud-select"
                value={selectedName ? selectedName : ""}
                onChange={handleChange}
                >
                    {valueItems.map((cloud: Cloud) => (
                        <MenuItem 
                        key={cloud.cloud_name} 
                        value={cloud.cloud_name}
                        >
                        {cloud.cloud_name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth>
                <InputLabel id="provider-select-label">Provider</InputLabel>
                <Select
                labelId="Provider-select-label"
                id="provider-select"
                value={props.selectedProvider ? props.selectedProvider : ""}
                onChange={handleProviderFilterChange}
                >
                    {providers.map((provider: string) => (
                        <MenuItem 
                        key={provider} 
                        value={provider}
                        >
                        {provider}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Distance 
            markersToRender={props.markersToRender}
            userLocation={props.userLocation}
            />
            <Button
            onClick={() => {
                selectClosest(props.data)
                props.setSelectedProvider("")
                }}
            >
              Select closest cloud
            </Button>
            <Button
            onClick={() => selectClosest(valueItems)}
            >
              Select closest cloud from provider
            </Button>
        </div>
    )
}