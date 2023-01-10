import React, { useRef, useState, memo } from 'react';
import {
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  makeStyles
} from '@material-ui/core';
import MoreIcon from '@material-ui/icons/MoreVert';
import ShareIcon from '@material-ui/icons/Share';
import EventNoteIcon from '@material-ui/icons/EventNote';
import CreateOutlinedIcon from '@material-ui/icons/CreateOutlined';
import CancelIcon from '@material-ui/icons/Cancel';

const useStyles = makeStyles(() => ({
  menu: {
    width: 256,
    maxWidth: '100%'
  }
}));

const GenericMoreButton = ({ className, disableDelBtn, ...rest }) => {
  const classes = useStyles();
  const moreRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(false);

  const handleMenuOpen = () => {
    setOpenMenu(true);
  };

  const handleMenuClose = () => {
    setOpenMenu(false);
  };

  const handleView = () => {
    console.log('Viewing');
    setOpenMenu(false);
    rest.handleView();
  };

  const handleEdit = () => {
    console.log('Editing');
    setOpenMenu(false);
    rest.handleEdit();
  };

  const handleShare = () => {
    console.log('scheduling');
    setOpenMenu(false);
    rest.handleShare();
  };

  const handleDelete = () => {
    console.log('deleting');
    setOpenMenu(false);
    rest.handleDelete();
  };

  return (
    <>
      <Tooltip title="More options">
        <IconButton onClick={handleMenuOpen} ref={moreRef}>
          <MoreIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={moreRef.current}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={handleMenuClose}
        open={openMenu}
        PaperProps={{ className: classes.menu }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={handleShare} disabled={disableDelBtn}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText primary="Share" />
        </MenuItem>
        <MenuItem onClick={handleEdit} disabled={disableDelBtn}>
          <ListItemIcon>
            <CreateOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDelete} disabled={disableDelBtn}>
          <ListItemIcon>
            <CancelIcon />
          </ListItemIcon>
          <ListItemText primary="Cancel" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(GenericMoreButton);
