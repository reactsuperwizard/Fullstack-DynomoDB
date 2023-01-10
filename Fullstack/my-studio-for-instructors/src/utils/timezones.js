import moment from 'moment-timezone';

const getTimeZoneOptions = showTimezoneOffset => {
  const timeZones = moment.tz.names();
  const offsetTmz = [];
  for (let i in timeZones) {
    const tz = timeZones[i];
    const tzOffset = moment.tz(tz).format('Z');
    const value = parseInt(
      tzOffset
        .replace(':00', '.00')
        .replace(':15', '.25')
        .replace(':30', '.50')
        .replace(':45', '.75')
    ).toFixed(2);
    const timeZoneOption = {
      name: showTimezoneOffset ? tz + ' (GMT' + tzOffset + ')' : tz,
      value,
      timezoneOffset: tzOffset
    };
    offsetTmz.push(timeZoneOption);
  }
  return offsetTmz;
};

const getCurrentTimeZone = () => {
  const tz = moment.tz.guess();

  const tzOffset = moment.tz(tz).format('Z');

  return tz + ' (GMT' + tzOffset + ')';
};

export { getTimeZoneOptions, getCurrentTimeZone };
