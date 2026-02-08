export type PropertyQuery = {
    page : number | string,
    limit? : number | string,
    categoryid? : number | string,
    name? : string,
    sortby? : 'name' | 'price',
    order? : 'asc' | 'desc',
    search? : string,
    lowestPrice? : "float",
    latitude? : number,
    longitude? : number,
    checkIn? :string,
    checkOut? : string,
};

export type CreateRoomInput = {
    name : string,
    description : string,
    basePrice : number,
    capacity : number,
    startDate : Date,
    endDate : Date
};

export type CreatePropertyInput = {
    name : string,
    description : string,
    image : string,
    categoryId : number,
    address : string,
    rooms : CreateRoomInput[],
    latitude : number,
    longitude : number,
}