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
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ShareIcon from '@material-ui/icons/Share';
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
    setOpenMenu(false);
    rest.handleView();
  };

  const handleEdit = () => {
    console.log('Editing');
    setOpenMenu(false);
    rest.handleEdit();
  };

  const handleShare = () => {
    console.log('Sharing');
    setOpenMenu(false);
    rest.handleShare();
  };

  const handleCancel = () => {
    console.log('canceling');
    setOpenMenu(false);
    rest.handleCancel();
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
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={handleMenuClose}
        open={openMenu}
        PaperProps={{ className: classes.menu }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ArrowForwardIcon />
          </ListItemIcon>
          <ListItemText primary="View" />
        </MenuItem>
        <MenuItem onClick={handleShare} disabled={disableDelBtn}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText primary="Share"/>
        </MenuItem>
        <MenuItem onClick={handleEdit} disabled={disableDelBtn}>
          <ListItemIcon>
            <CreateOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Edit"/>
        </MenuItem>
        <MenuItem onClick={handleCancel} disabled={disableDelBtn}>
          <ListItemIcon>
            <CancelIcon />
          </ListItemIcon>
          <ListItemText primary="Cancel the event" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(GenericMoreButton);
