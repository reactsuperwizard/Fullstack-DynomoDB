import React, { useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import parse from 'autosuggest-highlight/parse';
import throttle from 'lodash/throttle';

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

const autocompleteService = { current: null };

const useStyles = makeStyles(theme => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2)
  }
}));

export default function GoogleMaps({
  defaultValue,
  onChange,
  error,
  helperText,
  initialPlaceID
}) {
  const classes = useStyles();
  const [value, setValue] = React.useState({ description: defaultValue || '' });
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState([]);
  const loaded = React.useRef(false);

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

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    []
  );

  React.useEffect(() => {
    let active = true;

    if (!autocompleteService.current && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue }, results => {
      if (active) {
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  React.useEffect(() => {
    if (
      window.google &&
      initialPlaceID !== undefined &&
      initialPlaceID !== null &&
      initialPlaceID !== ''
    ) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: initialPlaceID }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            setValue({ description: results[0].formatted_address });
          } else {
            console.error('No results found for placeID');
          }
        } else {
          console.error('Geocoder failed due to: ' + status);
        }
      });
    }
  }, [window.google]);

  return (
    <Autocomplete
      id="google-map-demo"
      getOptionLabel={option =>
        typeof option === 'string' ? option : option.description
      }
      filterOptions={x => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        onChange(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={params => (
        <TextField
          {...params}
          label="Add a location"
          variant="outlined"
          fullWidth
          error={error}
          helperText={helperText}
          name="address"
        />
      )}
      renderOption={option => {
        let parts = [];
        if (option.structured_formatting !== undefined) {
          const matches =
            option.structured_formatting.main_text_matched_substrings;
          parts = parse(
            option.structured_formatting.main_text,
            matches.map(match => [match.offset, match.offset + match.length])
          );
        }

        return (
          <Grid container alignItems="center">
            <Grid item>
              <LocationOnIcon className={classes.icon} />
            </Grid>
            <Grid item xs>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{ fontWeight: part.highlight ? 700 : 400 }}
                >
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.structured_formatting !== undefined
                  ? option.structured_formatting.secondary_text
                  : ''}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
  );
}
