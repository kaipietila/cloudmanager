import React from 'react';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple } from 'leaflet';
import axios from 'axios';
import { AxiosResponse } from 'axios';
import { useState, useEffect } from 'react';
import { CloudSelector } from './selector';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [24,36],
    iconAnchor: [12,36]
});

L.Marker.prototype.options.icon = DefaultIcon;

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [24,36],
  iconAnchor: [12,36],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface Cloud {
  cloud_name: string;
  cloud_description: string;
  geo_longitude: number;
  geo_latitude: number;
  distance: number | null;
}

interface MarkerProps {
  key: string;
  data: Cloud;
}
interface MapProps {
  markersToRender: Cloud[]
  className: string;
  userLocation: LatLngTuple | null[];
}
interface UserMarkerProps {
  lat: number | null;
  long: number | null;
}

const CloudMarker = (props: MarkerProps) => {
  const data = props.data
  const lat = data.geo_latitude
  const long = data.geo_longitude

  return (
    <Marker position={[lat, long]}>
      <Popup>
        {data.cloud_name} <br /> {data.cloud_description}
      </Popup>
    </Marker>
  )
}

const UserMarker = (props:UserMarkerProps) => {
  if (!props.lat || !props.long) {
    return null
  }
  return (
    <Marker 
    position={[props.lat, props.long]}
    icon={greenIcon}
    >
      <Popup>
        Your location
      </Popup>
    </Marker>
  )
}

const Map = (props: MapProps) => {
  const markersToRender = props.markersToRender
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([51.505, -0.09])
  const [map, setMap] = useState<any>(null)

  const [userLatitude, userLongitude] = props.userLocation

  useEffect(() => {
    if (markersToRender.length === 1) {
      setMapCenter([markersToRender[0].geo_latitude, markersToRender[0].geo_longitude])
  }
  }, [markersToRender]);

  if (map) {
    map.flyTo(mapCenter);
  }

  return (
    <MapContainer center={mapCenter} zoom={5} whenCreated={setMap}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markersToRender.map((cloudData: Cloud) => (
          <CloudMarker 
            key={cloudData.cloud_name}
            data={cloudData} />
        ))}
        <UserMarker 
        lat={userLatitude}
        long={userLongitude}
        />
      </MapContainer>
  )
}


export const App = () => {
  const baseUrl = 'http://localhost:8000'
  const [data, setData] = useState([])
  const [selected, setSelected] = useState([])
  const [userLoc, setUserLoc] = useState<LatLngTuple | null[]>([null, null])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  let hasErrors;

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        setUserLoc([position.coords.latitude, position.coords.longitude])
      });
  }
  getUserLocation()
  
  useEffect(() => {
    axios.get(baseUrl + '/clouds')
    .then((response: AxiosResponse) => setData(response.data))
    .catch((error: Error) => {
      hasErrors = true
    })
  }, []);

  const markersToRender = (): Cloud[] => {
    if (!selected.length && !selectedProvider.length) {
      return data
    } else if (selectedProvider && !selected.length) {
      return data.filter((cloud: Cloud) => cloud.cloud_name.startsWith(selectedProvider))
    } else {
      return selected
    }
  }
  const markers = markersToRender()
  if (hasErrors) {
    return (
      <div>
        <p>Unable to load data. Try again!</p>
      </div>
    )
  }
  return (
    <div className="App">
      <CloudSelector 
      className="cloudselector"
      data={data}
      markersToRender={markers}
      setSelected={setSelected}
      userLocation={userLoc}
      setSelectedProvider={setSelectedProvider}
      selectedProvider={selectedProvider}
      />
      <Map 
      className="map"
      markersToRender={markers}
      userLocation={userLoc}
      />
    </div>
  );
}

export default App;
