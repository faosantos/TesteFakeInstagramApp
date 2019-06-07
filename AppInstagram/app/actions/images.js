import * as types from './types';
import Api from '../lib/api';
import * as config from '../config';
import * as apiUtils from '../utils/api';

export function fetchImages(tag) {
    return (dispatch, getState) => {
        return Api.get(`${config.CDNUriBase}/${config.CDNCloudName}/image/list/${encodeURIComponent(tag)}.json`)
            .then((response) => {
                dispatch(setSearchedImages({ images: response.resources }));
            })
            .catch((ex) => {
               // NOTA: quando o CDN do Cloudinary não encontrou nenhum item usando a tag dada para a pesquisa
                 // ele retorna um erro 404 e uma mensagem dizendo 'Recurso não encontrado - Nenhum recurso encontrado para a lista de tipos nosuchtag'
                 // em um cabeçalho proeprty chamado 'x-cld-error'. É por isso que precisamos fazer esse tipo de validação na captura
                const noItemsHeader = ex.headers.map['x-cld-error'];
                if (noItemsHeader && noItemsHeader.length) {
                    // TODO: pesquise e melhore este
                    dispatch(setSearchedImages({ images: [] }));
                }
                else {
                    throw ex;
                }
            });
    }
}

export function setSearchedImages({ images }) {
    return {
        type: types.SET_SEARCHED_IMAGES,
        images
    };
}

export function setCurrentSearchTag(tag) {
    return {
        type: types.SET_CURRENT_SEARCH_TAG,
        tag
    };
}

export function uploadImage(image) { //imageData, imageExtension, tagsArray, caption
    return (dispatch, getState) => {
        const url = `${config.CDNApiUriBase}/${config.CDNCloudName}/image/upload`;
        const params = {
            file: `data:image/${image.imageExtension};base64,${image.data}`,
            tags: image.tags.join(','),
            api_key: config.CDNApiKey,
            timestamp: (+ new Date())
        };
        let contextValues = [];
        if(image.caption) {
            contextValues.push(`caption=${image.caption}`);
        }
        if(image.location && image.location.latitude && image.location.longitude) {
            contextValues.push(`latitude=${image.location.latitude}|longitude=${image.location.longitude}`);
        }
        if(contextValues.length) {
            params.context = contextValues.join('|');
        }
        params.signature = apiUtils.generateApiSignature(params, config.CDNApiSecret, ['api_key', 'file']);

        return Api.post(url, params)
        .then(image => {
            console.log(image);
            dispatch({
                type: types.IMAGE_UPLOADED,
                image: image
            });
            return image;
        })
        .catch(ex => {
            throw ex;
        });
    }
}