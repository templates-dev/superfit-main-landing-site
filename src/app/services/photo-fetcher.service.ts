import { Injectable } from "@angular/core";
import { AngularFireStorage } from '@angular/fire/storage';
import {
  IPhotoResponse_V1,
  IVideoResponse_V1,
  IAthlete_Response_V1
} from "superfitjs";
require('es6-promise/auto')
import { tap, finalize, catchError, take, map } from "rxjs/operators"
import { Observable } from 'rxjs';
import { Inject } from "@angular/core"
import { ApiService } from './api.service';

export enum UploadType {
  Image = "Image",
  Video = "Video"
}

@Injectable({ providedIn: 'root' })
export class SFPhotoFetcherService {

  private images = new Map<string, any>()

  constructor(
    private storage: AngularFireStorage,
    private apiService: ApiService
  ) {
  }

  async createUserImageFilePath(user: IAthlete_Response_V1, fileName: string): Promise<string> {
    return `users/${user.userId}/${fileName}`;
  }

  private fetchAndCachePhotos(ids: string[]): Observable<IPhotoResponse_V1[]> {
    return this.apiService.fetchPhotos(ids)
      .pipe(
        tap(photos => {
          for (let photo of photos) {
            this.images.set(photo.id, photo)
          }
        }),
        take(1)
      )
  }

  private fetchAndCacheVideos(ids: string[]): Observable<IVideoResponse_V1[]> {
    return this.apiService.fetchVideos(ids)
      .pipe(
        tap(videos => {
          for (let video of videos) {
            this.images.set(video.id, video)
          }
        }),
        take(1)
      )
  }

  async getPhoto(id: string): Promise<IPhotoResponse_V1 | undefined> {
    let cachedPhoto = this.images.get(id)
    if (cachedPhoto) {
      return cachedPhoto
    } else {
      return this
        .fetchAndCachePhotos([id])
        .pipe(map(photos => photos[0]))
        .toPromise()
    }
  }


  async getVideo(id: string): Promise<IVideoResponse_V1 | undefined> {
    let cachedVideo = this.images.get(id)
    if (cachedVideo) {
      return cachedVideo
    } else {
      return this
        .fetchAndCacheVideos([id])
        .pipe(map(videos => videos[0]))
        .toPromise()
    }
  }

  async fetchThumbnailPromise(
    size: ThumbnailSize,
    filePath: String): Promise<string> {
    let filePathComponents = filePath.split("/")
    let imageName = filePathComponents[filePathComponents.length - 1]

    if (!imageName) {
      throw Error("no image name")
      return
    }

    let thumbnailUrl = filePathComponents.reduce((composedString, component) => {
      if (component != imageName) {
        return composedString + `/${component}`
      } else {
        // Last component of path, most
        // likely the image file name.
        return composedString + `/thumb@${size}_${component}`
      }
    })

    return this.firebaseImageUrl(thumbnailUrl)
  }

  private async firebaseImageUrl(path: string): Promise<string> {
    let spaceRef = this.storage.storage.ref(path)
    return spaceRef.getDownloadURL()
  }

  // fetchThumbnailUrl(
  //   size: ThumbnailSize,
  //   filePath: String,
  //   completion: ((string?) => void)
  // ) {
  //   let filePathComponents = filePath.split("/")
  //   let imageName = filePathComponents[filePathComponents.length - 1]

  //   if (!imageName) {
  //     completion(null)
  //     return
  //   }

  //   let thumbnailUrl = filePathComponents.reduce((composedString, component) => {
  //     if (component != imageName) {
  //       return composedString + `/${component}`
  //     } else {
  //       // Last component of path, most
  //       // likely the image file name.
  //       return composedString + `/thumb@${size}_${component}`
  //     }
  //   })

  //   this.fetchFirebaseImageUrl(thumbnailUrl, completion)
  // }

  // private fetchFirebaseImageUrl(
  //   path: string,
  //   completion: ((string?) => void)
  // ) {
  //   let spaceRef = this.storage.storage.ref(path)
  //   spaceRef.getDownloadURL()
  //     .then(url => {
  //       completion(url)
  //     })
  //     .catch(error => {
  //       completion(null)
  //     })
  // }
}

export const enum ThumbnailSize {
  sixtyFour = 64,
  twoFiftySix = 256,
  fiveTwelve = 512
}