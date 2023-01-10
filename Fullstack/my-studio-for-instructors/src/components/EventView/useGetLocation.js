import React, { useRef, useEffect, useState } from 'react';

function loadScript(src, position, id) {
  if (!position) {
    return;
  }

  const script = document.createElement('script');
  script.setAttribute('async', '');
  script.setAttribute('id', id);
  script.src = src;
  position.appendChild(script);
}

const useGetLocation = placeId => {
  const loaded = useRef(false);
  const [location, setLocation] = useState('');

  if (typeof window !== 'undefined' && !loaded.current) {
    if (!document.querySelector('#google-maps')) {
      loadScript(
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyDlZn2qPv4gBbbT4sbljBATw3-e48CL1MQ&libraries=places',
        document.querySelector('head'),
        'google-maps'
      );
    }

    loaded.current = true;
  }

  useEffect(() => {
    if (
      window.google &&
      placeId !== undefined &&
      placeId !== null &&
      placeId !== ''
    ) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            setLocation(results[0].formatted_address);
          } else {
            console.error('No results found for placeID');
          }
        } else {
          console.error('Geocoder failed due to: ' + status);
        }
      });
    }
  }, [window.google]);

  return location;
};

export default useGetLocation;
