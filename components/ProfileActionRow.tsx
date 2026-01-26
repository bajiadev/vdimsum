import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileActionRow = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between w-full px-4 py-4 border-b border-gray-200"
  >
    <View className="flex-row items-center gap-3">
      <Ionicons name={icon} size={22} />
      <Text className="text-base">{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#999" />
  </TouchableOpacity>
);

export default ProfileActionRow;
