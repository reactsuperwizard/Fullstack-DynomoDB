import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import PerfectScrollbar from 'react-perfect-scrollbar';
import moment from 'moment';
import {
  Box,
  Card,
  InputAdornment,
  Link,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  makeStyles,
  Typography
} from '@material-ui/core';
import { Search as SearchIcon } from 'react-feather';
import GenericMoreButton from './ClassResultsMenu';
import ClassDeleteDialog from 'src/components/general/ClassDeleteDialog';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const sortOptions = [
  {
    value: 'createdAt',
    label: 'Date added'
  },
  {
    value: 'updatedAt',
    label: 'Date updated'
  },
  {
    value: 'name',
    label: 'Name'
  }
];

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function(a, b) {
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

const applyQuery = (classes, query) => {
  return classes.filter(classInstance => {
    let matches = true;

    if (
      query &&
      !classInstance.name.toLowerCase().includes(query.toLowerCase())
    ) {
      matches = false;
    }

    return matches;
  });
};

const useStyles = makeStyles(theme => ({
  root: {},
  bulkOperations: {
    position: 'relative'
  },
  bulkActions: {
    paddingLeft: 4,
    paddingRight: 4,
    marginTop: 6,
    position: 'absolute',
    width: '100%',
    zIndex: 2,
    backgroundColor: theme.palette.background.default
  },
  bulkAction: {
    marginLeft: theme.spacing(2)
  },
  queryField: {
    width: 500
  },
  categoryField: {
    flexBasis: 200
  },
  availabilityField: {
    marginLeft: theme.spacing(2),
    flexBasis: 200
  },
  stockField: {
    marginLeft: theme.spacing(2)
  },
  shippableField: {
    marginLeft: theme.spacing(2)
  },
  imageCell: {
    fontSize: 0,
    width: 68,
    flexBasis: 68,
    flexGrow: 0,
    flexShrink: 0
  },
  image: {
    height: 68,
    width: 68
  },
  pointerCursor: {
    cursor: 'pointer'
  }
}));

const Results = ({ className, verified, classes, ...rest }) => {
  const styleClasses = useStyles();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(sortOptions[0].value);
  const [open, setOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState({});
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const filteredClasses = applyQuery(classes, query);
  const classesSorted = filteredClasses.sort(dynamicSort(sort));

  const handleQueryChange = event => {
    event.persist();
    setQuery(event.target.value);
  };

  const handleSortChange = event => {
    event.persist();
    setSort(event.target.value);
  };

  const handleDelete = classInstance => {
    setOpen(true);
    setClassToDelete(classInstance);
  };

  const handleView = classInstance => {
    console.log(classInstance);
    history.push('/app/classes/view', { classInstance });
  };

  const handleEdit = classInstance => {
    console.log(classInstance);
    history.push('/app/classes/edit', { classInstance });
  };

  const handleSchedule = classInstance => {
    if (!verified) {
      enqueueSnackbar('Verify your email in order to make a schedule.', {
        variant: 'error'
      });
      return;
    }
    history.push('/app/events/create', {
      classId: classInstance.id,
      classsName: classInstance.name
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Card className={clsx(styleClasses.root, className)} {...rest}>
      <Box p={2}>
        <Box display="flex" alignItems="center">
          <TextField
            className={styleClasses.queryField}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SvgIcon fontSize="small" color="action">
                    <SearchIcon />
                  </SvgIcon>
                </InputAdornment>
              )
            }}
            onChange={handleQueryChange}
            placeholder="Search classes"
            value={query}
            variant="outlined"
          />
          <Box flexGrow={1} />
          <TextField
            label="Sort By"
            name="sort"
            onChange={handleSortChange}
            select
            SelectProps={{ native: true }}
            value={sort}
            variant="outlined"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
        </Box>
      </Box>

      <PerfectScrollbar>
        <Box minWidth={300}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classesSorted.map(classInstance => {
                return (
                  <TableRow
                    hover
                    key={classInstance.id}
                    className={styleClasses.pointerCursor}
                  >
                    <TableCell>
                      <Link
                        variant="subtitle2"
                        color="textPrimary"
                        underline="none"
                        onClick={() => handleView(classInstance)}
                      >
                        <Typography variant="h4">
                          {classInstance.name}
                        </Typography>
                      </Link>
                      {classInstance.updatedAt ? (
                        <Typography variant="caption">
                          Updated on:{' '}
                          {moment
                            .unix(classInstance.updatedAt)
                            .format('MM/DD/YYYY')}
                        </Typography>
                      ) : (
                        <Typography variant="caption">
                          Created on:{' '}
                          {moment
                            .unix(classInstance.createdAt)
                            .format('MM/DD/YYYY')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{classInstance.category}</TableCell>
                    <TableCell align="right">
                      <GenericMoreButton
                        handleDelete={() => handleDelete(classInstance)}
                        handleView={() => handleView(classInstance)}
                        handleSchedule={() => handleSchedule(classInstance)}
                        handleEdit={() => handleEdit(classInstance)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        <ClassDeleteDialog
          openFlag={open}
          classIns={classToDelete}
          close={handleClose}
        />
      </PerfectScrollbar>
    </Card>
  );
};

Results.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.array.isRequired
};

Results.defaultProps = {
  classes: []
};

export default Results;
