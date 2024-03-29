export const youtubeParser = (url: string) => {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
}

export const rawCharacters = (string: string) => {
    return string.replaceAll(/[^a-zA-z]/g, "").toLowerCase();
}