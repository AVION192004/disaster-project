import tensorflow as tf
from tensorflow.keras.layers import Layer
from tensorflow.keras.utils import register_keras_serializable

# ✅ Register Custom Objects
@register_keras_serializable()
class SkipConnLayer(Layer):
    def __init__(self, key, **kwargs):
        super(SkipConnLayer, self).__init__(**kwargs)
        self.key = key

    def call(self, inputs):
        return inputs

    def get_config(self):
        config = super().get_config()
        config.update({'key': self.key})
        return config

@register_keras_serializable()
class AttentionLayer(Layer):
    def __init__(self, key, num_of_filters, **kwargs):  # Accept extra kwargs
        super(AttentionLayer, self).__init__(**kwargs)  # Pass them to the base class
        self.key = key
        self.num_of_filters = num_of_filters
        self.prev_layer_conv = tf.keras.layers.Conv2D(num_of_filters, (1,1), activation='relu', kernel_initializer='he_normal')
        self.skip_conv = tf.keras.layers.Conv2D(num_of_filters, (1,1), strides=(2,2), activation='relu', kernel_initializer='he_normal')
        self.post_add_activation = tf.keras.layers.Activation(activation='relu')
        self.proj_conv = tf.keras.layers.Conv2D(1, (1,1), activation='relu', kernel_initializer='he_normal')
        self.pre_upsample_activation = tf.keras.layers.Activation(activation='sigmoid')

    def call(self, inputs, skip_conn_data):
        skip_input = skip_conn_data[self.key]
        inputs_temp = self.prev_layer_conv(inputs)
        skip_temp = self.skip_conv(skip_input)
        temp_features = tf.add(inputs_temp, skip_temp)
        temp_features = self.post_add_activation(temp_features)
        temp_features = self.proj_conv(temp_features)
        temp_features = self.post_add_activation(temp_features)
        temp_features = tf.image.resize(temp_features, (skip_input.shape[1], skip_input.shape[2]), method='bilinear')
        return tf.math.multiply(skip_input, temp_features)

    def get_config(self):
        config = super().get_config()
        config.update({'key': self.key, 'num_of_filters': self.num_of_filters})
        return config

@register_keras_serializable()
class MyMeanIOU(tf.keras.metrics.MeanIoU):
    def update_state(self, y_true, y_pred, sample_weight=None):
        return super().update_state(tf.argmax(y_true, axis=-1), tf.argmax(y_pred, axis=-1), sample_weight)
