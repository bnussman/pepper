import { ReactNativeFile } from "apollo-upload-client";
import { Platform } from "react-native";
// @ts-expect-error this package has no types :(
import * as mime from "react-native-mime-types";

export const isMobile: boolean =
  Platform.OS == "ios" || Platform.OS == "android";

export function generateRNFile(uri: string, name: string) {
  return uri
    ? new ReactNativeFile({
        uri,
        type: mime.lookup(uri) || "audio",
        name,
      })
    : null;
}
