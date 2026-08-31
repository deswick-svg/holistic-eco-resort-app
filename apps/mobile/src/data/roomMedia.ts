export type RoomMedia = {
  primaryImage: string;
  gallery: string[];
};

export const roomMedia: Record<string, RoomMedia> = {
  "103941": {
    primaryImage:
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_119,w_1280,h_719,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-3",
    gallery: [
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_119,w_1280,h_719,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-3",
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_363,w_1200,h_674,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-4",
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_782,w_1200,h_674,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-5",
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_337,w_1200,h_674,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-2",
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_657,w_1200,h_674,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-1",
      "https://assets.simplotel.com/simplotel/image/upload/x_0,y_739,w_1200,h_674,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-bathroom-6",
    ],
  },
  "103939": {
  primaryImage:
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_120,w_1280,h_720,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133282_452bcf4c",
  gallery: [
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_120,w_1280,h_720,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133282_452bcf4c",
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_120,w_1280,h_720,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133286_(1)_3a1fe9eb",
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_370,w_960,h_540,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133283_e6c733d5",
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_120,w_1280,h_720,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133284_b27c8834",
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_120,w_1280,h_720,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133285_7830e146",
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_601,w_960,h_539,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133288_beb521c5",
    "https://assets.simplotel.com/simplotel/image/upload/x_0,y_370,w_960,h_540,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133289_89dc86a2",
  ],
},
};

export const getRoomMedia = (roomTypeId: string) =>
  roomMedia[roomTypeId];
