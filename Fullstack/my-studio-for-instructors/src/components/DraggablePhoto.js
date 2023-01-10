import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import { makeStyles } from '@material-ui/core';
const imgWithClick = { cursor: 'crosshair' };
const useStyles = makeStyles(() => ({
  itemImage: {
    width: 'auto',
    height: 250,
    objectFit: 'cover',
    paddingRight: 3,
  }
}));
const Photo = ({
  keyIndex,
  onClick,
  photo,
  margin,
  direction,
  top,
  left,
  onDeleteItem
}) => {
  const imgStyle = { margin: margin };
  const classes = useStyles();
  if (direction === 'column') {
    imgStyle.position = 'absolute';
    imgStyle.left = left;
    imgStyle.top = top;
  }
  const handleClick = event => {
    onClick(event, { photo, keyIndex });
  };
  return (
    <div>
      <div style={{ height: 0 }}>
        <IconButton
          aria-label="delete"
          onClick={() => onDeleteItem(keyIndex)}
          style={{ color: 'white' }}
        >
          <DeleteIcon />
        </IconButton>
      </div>
      <div>
        <img
          style={onClick ? { ...imgStyle, ...imgWithClick } : imgStyle}
          {...photo}
          onClick={onClick ? handleClick : null}
          alt="img"
          className={classes.itemImage}
        />
      </div>
    </div>
  );
};
export default Photo;
