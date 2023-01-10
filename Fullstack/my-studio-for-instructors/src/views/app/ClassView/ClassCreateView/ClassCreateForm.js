import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormHelperText,
  Grid,
  Paper,
  TextField,
  Typography,
  makeStyles
} from '@material-ui/core';
import QuillEditor from 'src/components/QuillEditor';
import FilesDropzone from 'src/components/FilesDropzone';
import { createClass, uploadImages } from 'src/slices/class';
import { useDispatch, useSelector } from 'src/store';
import { v4 as uuidv4 } from 'uuid';
import { CircularProgress } from '@material-ui/core';
import SubmitButton from 'src/components/general/SubmitButton';

import Gallery from 'react-photo-gallery';
import Photo from 'src/components/DraggablePhoto';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import useAuth from 'src/hooks/useAuth';

const difficulties = [
  {
    id: 'All Levels',
    name: 'All Levels'
  },
  {
    id: 'Beginner',
    name: 'Beginner'
  },
  {
    id: 'Intermediate',
    name: 'Intermediate'
  },
  {
    id: 'Advanced',
    name: 'Advanced'
  }
];

const useStyles = makeStyles(() => ({
  root: {},
  editor: {
    '& .ql-editor': {
      height: 200
    }
  },
  buttonProgress: {
    position: 'absolute',
    top: '40%',
    left: '41%'
  },
  relativeWrapper: {
    position: 'relative'
  }
}));

const SortablePhoto = SortableElement(item => <Photo {...item} />);
const SortableGallery = SortableContainer(({ items, onDeleteItem }) => (
  <Gallery
    photos={items}
    renderImage={props => (
      <SortablePhoto
        onDeleteItem={onDeleteItem}
        keyIndex={props.index}
        {...props}
      />
    )}
  />
));

const ClassCreateForm = ({ className, ...rest }) => {
  const classes = useStyles();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [fileCnt, setFileCnt] = useState(0);

  const { isUploading, imageLinks, error } = useSelector(
    state => state.classes
  );

  useEffect(() => {
    console.log('here is links', imageLinks);
    if (imageLinks !== null && imageLinks.length !== 0) {
      const _links = JSON.parse(JSON.stringify(imageLinks));
      setItems(prev => {
        if (prev) return prev.concat(_links);
        else return _links;
      });
    }
  }, [imageLinks]);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    console.log('index', oldIndex, newIndex);
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  const onDeleteImageItem = index => {
    setItems(prevItems => {
      console.log(`Delete index=${index} pervItems: ${prevItems}`);
      return [...prevItems.slice(0, index), ...prevItems.slice(index + 1)];
    });
    setFileCnt(prev => prev - 1);
  };

  const handleDrop = useCallback(
    async acceptedFiles => {
      let bFileSizeOverflow = false;
      acceptedFiles.map(file => {
        if (file.size > 1048576) {
          bFileSizeOverflow = true;
        }
      });

      if (bFileSizeOverflow) {
        enqueueSnackbar(
          'Failed to upload files,  FileSize must be less than 1MB.',
          {
            variant: 'error'
          }
        );
        return;
      }
      console.log(`accepted image cnt=${fileCnt}, new=${acceptedFiles.length}`);
      if (fileCnt + acceptedFiles.length > 5) {
        enqueueSnackbar(
          'Failed to upload files, up to 5 files can be uploaded.',
          {
            variant: 'error'
          }
        );
        return;
      }
      await dispatch(uploadImages(acceptedFiles));
      console.log('error :>> ', error);
      setFileCnt(prev => prev + acceptedFiles.length);
    },
    [fileCnt]
  );

  // const handleRemoveAll = () => {
  //   setFiles([]);
  // };

  return (
    <Formik
      initialValues={{
        id: uuidv4(),
        userId: user.id,
        difficulty: 'All Levels',
        category: '',
        atAGlance: '',
        equipment: '',
        images: [],
        name: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        difficulty: Yup.string().max(255),
        category: Yup.string().max(255),
        atAGlance: Yup.string().max(1000),
        equipment: Yup.string().max(1000),
        images: Yup.array(),
        name: Yup.string()
          .max(255)
          .required()
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          // NOTE: Make API request

          if (items && items.length !== 0) values['files'] = items;
          await dispatch(createClass(values));

          setStatus({ success: true });
          setSubmitting(false);
          enqueueSnackbar('Class Created', {
            variant: 'success'
          });

          history.push('/app/classes');
        } catch (err) {
          console.error(err);
          setStatus({ success: false });
          setErrors({ submit: err.message });
          setSubmitting(false);
        }
      }}
    >
      {({
        errors,
        handleBlur,
        handleChange,
        handleSubmit,
        isSubmitting,
        setFieldValue,
        touched,
        values
      }) => (
        <form
          onSubmit={handleSubmit}
          className={clsx(classes.root, className)}
          {...rest}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} lg={12}>
              <Card>
                <CardContent>
                  <TextField
                    error={Boolean(touched.name && errors.name)}
                    fullWidth
                    helperText={touched.name && errors.name}
                    label="Class Name"
                    name="name"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.name}
                    variant="outlined"
                  />

                  <Box mt={3} mb={1}>
                    <Grid container spacing={4}>
                      <Grid item md={6} xs={12}>
                        <TextField
                          error={Boolean(touched.category && errors.category)}
                          fullWidth
                          helperText={touched.category && errors.category}
                          label="Category"
                          name="category"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          value={values.category}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item md={6} xs={12}>
                        <TextField
                          fullWidth
                          label="Difficulty"
                          name="difficulty"
                          onChange={handleChange}
                          select
                          SelectProps={{ native: true }}
                          value={values.difficulty}
                          variant="outlined"
                        >
                          {difficulties.map(difficulty => (
                            <option key={difficulty.id} value={difficulty.id}>
                              {difficulty.name}
                            </option>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>
                  <Box mt={3} mb={1}>
                    <Typography variant="subtitle2" color="textSecondary">
                      At a Glance
                    </Typography>
                  </Box>
                  <Paper variant="outlined">
                    <QuillEditor
                      className={classes.editor}
                      value={values.atAGlance}
                      onChange={value => setFieldValue('atAGlance', value)}
                    />
                  </Paper>
                  {touched.atAGlance && errors.atAGlance && (
                    <Box mt={2}>
                      <FormHelperText error>{errors.atAGlance}</FormHelperText>
                    </Box>
                  )}
                  <Box mt={3} mb={1}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Equipment
                    </Typography>
                  </Box>
                  <Paper variant="outlined">
                    <QuillEditor
                      className={classes.editor}
                      value={values.equipment}
                      onChange={value => setFieldValue('equipment', value)}
                    />
                  </Paper>
                  {touched.equipment && errors.equipment && (
                    <Box mt={2}>
                      <FormHelperText error>{errors.equipment}</FormHelperText>
                    </Box>
                  )}
                </CardContent>
              </Card>
              <Box mt={3}>
                <Card>
                  <CardHeader title="Upload Images" />
                  <Divider />
                  <CardContent className={classes.relativeWrapper}>
                    <FilesDropzone
                      handleDrop={handleDrop}
                      // handleRemoveAll={handleRemoveAll}
                      disabled={true}
                      isUploading={isUploading}
                    />
                    {isUploading && (
                      <CircularProgress
                        size={70}
                        className={classes.buttonProgress}
                      />
                    )}
                  </CardContent>
                  <Divider />
                  {items !== null && items.length !== 0 && (
                    <SortableGallery
                      items={items}
                      onSortEnd={onSortEnd}
                      axis={'xy'}
                      margin={10}
                      onDeleteItem={onDeleteImageItem}
                      distance={1}
                    />
                  )}
                </Card>
              </Box>
            </Grid>
            <Grid item xs={12} lg={4}></Grid>
          </Grid>
          {errors.submit && (
            <Box mt={3}>
              <FormHelperText error>{errors.submit}</FormHelperText>
            </Box>
          )}
          <Box mt={2} display="flex" justifyContent="flex-start">
            <SubmitButton text="Add new class" isSubmitting={isSubmitting} />
          </Box>
        </form>
      )}
    </Formik>
  );
};

ClassCreateForm.propTypes = {
  className: PropTypes.string
};

export default ClassCreateForm;
