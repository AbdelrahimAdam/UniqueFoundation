// Corrected: Only export from the source files directly
export { default as userService } from "./userService";
export { default as sessionService } from "./sessionService";
export { default as recordingService } from "./recordingService";
export { default as courseService } from "./courseService";

// REMOVE the duplicate imports and exports below - they cause the conflict