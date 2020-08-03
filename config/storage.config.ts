export const StorageConfig = {
    photo: {
        destination: '../storage/photos/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dana traje kesirana slika
        urlPrefix: '/assets/photos', // localhost:3000/urlPrefix gets us in folder destination (  ../storage/photos/  )
        maxSize: 3 * 1024 * 1024,  // in bytes = 3 MB
        resize: {
            thumb: {
                width: 120,
                height: 100,
                directory: 'thumb/'
            }
            ,
            small: {
                width: 320,
                height: 240,
                directory: 'small/'
            }
        }
    }
}