import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';
import axios from 'src/utils/axiosApiGateway';
import { toBase64 } from 'src/utils';

const initialState = {
  classs: [],
  isModalOpen: false,
  selectedClassId: null,
  selectedRange: null,
  isUploading: false,
  imageLinks: null,
  error: null
};

const slice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    getClasss(state, action) {
      state.classs = action.payload;
    },
    createdClass(state) {
      console.log('class created');
      // const { Class } = action.payload;
      state.imageLinks = null;
      // state.classes = [...state.Classs, Class];
    },
    selectClass(state, action) {
      const { ClassId = null } = action.payload;

      state.isModalOpen = true;
      state.selectedClassId = ClassId;
    },
    updateClass(state, action) {},
    deleteClass(state, action) {
      const { ClassId } = action.payload;

      state.classs = _.reject(state.classs, { id: ClassId });
    },
    selectRange(state, action) {
      const { start, end } = action.payload;

      state.isModalOpen = true;
      state.selectedRange = {
        start,
        end
      };
    },
    openModal(state) {
      state.isModalOpen = true;
    },
    closeModal(state) {
      state.isModalOpen = false;
      state.selectedClassId = null;
      state.selectedRange = null;
    },
    startUploading(state) {
      state.isUploading = true;
    },
    imageUploaded(state, action) {
      state.isUploading = false;
      const _links = [];
      const { links } = action.payload;
      for (let i = 0; i < links.length; i++) {
        _links.push({ src: links[i], width: 3, height: 3 });
      }
      state.imageLinks = _links;
    },
    imgUploadFailed(state, action) {
      state.isUploading = false;
      state.error = action.payload;
    }
  }
});

export const reducer = slice.reducer;

export const getClasss = user => async dispatch => {
  const response = await axios.post('/get_classes', user);

  dispatch(slice.actions.getClasss(response.data.message));
};

export const createClass = data => async dispatch => {
  console.log('create class data', data);
  const images = [];
  if (data.files !== undefined && data.files.length !== 0) {
    for (let i = 0; i < data.files.length; i++) {
      images.push(data.files[i].src);
    }
    delete data.files;
  }
  data.images = images;
  console.log('creating class payload', data);
  const response = await axios.post('/create_class', data);
  //uploading images
  console.log('response from createClass', response);
  dispatch(slice.actions.createdClass());
};

export const uploadImages = files => async dispatch => {
  console.log('uploaidng files', files);
  dispatch(slice.actions.startUploading());
  const links = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const base64 = await toBase64(files[i]);
      const result = await axios.post('/upload_class_image', {
        file: base64
      });
      console.log('result :>> ', result);
      links.push(result.data.link);
    } catch (error) {
      console.log('error in upload image:>> ', error);
      await dispatch(
        slice.actions.imgUploadFailed(
          'Failed to upload files, not a valid file type or file too big.'
        )
      );
    }
  }
  console.log('links from S3: ', links);
  dispatch(slice.actions.imageUploaded({ links }));
};

export const selectClass = ClassId => async dispatch => {
  dispatch(slice.actions.selectClass({ ClassId }));
};

export const updateClass = (classId, update) => async dispatch => {
  const images = [];
  if (update.files !== undefined && update.files.length !== 0) {
    for (let i = 0; i < update.files.length; i++) {
      images.push(update.files[i].src);
    }
    delete update.files;
  }
  update.images = images;
  const response = await axios.post('/update_class', {
    classId,
    update
  });

  // console.log('update response :>> ', response.data);
  // dispatch(slice.actions.updateClass(response.data));
};

export const deleteClass = ClassId => async dispatch => {
  await axios.post('/delete_class', {
    id: ClassId
  });

  dispatch(slice.actions.deleteClass({ ClassId }));
};

export const selectRange = (start, end) => dispatch => {
  dispatch(
    slice.actions.selectRange({
      start: start.getTime(),
      end: end.getTime()
    })
  );
};

export const openModal = () => dispatch => {
  dispatch(slice.actions.openModal());
};

export const closeModal = () => dispatch => {
  dispatch(slice.actions.closeModal());
};

export default slice;
