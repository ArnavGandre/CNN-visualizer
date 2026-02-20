import tensorflow as tf
import tensorflowjs as tfjs


model = tf.keras.models.load_model('MNIST_keras_CNN.h5')

tfjs.converters.save_keras_model(model, 'tfjs_model')