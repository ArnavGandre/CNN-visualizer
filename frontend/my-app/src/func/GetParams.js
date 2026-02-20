import * as tf from "@tensorflow/tfjs";

async function extractModelParams(model){
      if (!model) throw new Error("model is undefined");
    const modelInfo=[];

    for(const layer of model.layers){
        const weights = layer.getWeights();
        
        if(weights.length===0) continue;

        const layerData = {
            name : layer.name,
            type: layer.getClassName(),
            params: []
        };

        for(let i = 0; i<weights.length; i++){
            const tensor = weights[i];

            const values = await tensor.data();

            layerData.params.push({
                kind: i===0? "Weights":"bias",
                shape: tensor.shape,
                values: Array.from(values),


            });


        }
        modelInfo.push(layerData);
    }
    return modelInfo;
}

export {extractModelParams}