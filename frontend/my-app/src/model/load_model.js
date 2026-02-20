import * as tf from '@tensorflow/tfjs'; 

const MODEL_URL = "./tfjs_model/model.json";

async function Load_model(){
try {
    const model =  await tf.loadLayersModel(MODEL_URL);

    console.log("model loaded");

    return model;
}catch (error){
    console.log("failed to load model :"+error)
}
}


export {Load_model};