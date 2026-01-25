import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import { Link } from "expo-router";

const PhotoCard = ({ photo }: { photo: string }) => {
  return (
    <Link
      href={{
        pathname: "/product/[id]",
        params: { photo: encodeURIComponent(photo) },
      }}
      asChild
    >
      <Pressable>
        <Image source={{ uri: photo }} className="w-80 h-60 rounded-3xl p-2" />
      </Pressable>
    </Link>
  );
};

export default PhotoCard;
