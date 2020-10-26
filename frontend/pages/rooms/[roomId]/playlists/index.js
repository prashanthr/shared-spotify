import {useRouter} from 'next/router'
import styles from "../../../../styles/rooms/Rooms.module.scss";
import {showErrorToastWithError, showSuccessToast, Toast} from "../../../../components/toast";
import axios from "axios";
import {useEffect, useState} from "react";
import PlaylistElem from "../../../../components/playlistElem";
import ReactAudioPlayer from "react-audio-player";
import {Button, OverlayTrigger, Spinner, Tooltip} from "react-bootstrap";
import {getArtistsFromTrack} from "../../../../utils/trackUtils";
import {isEmpty} from "lodash"
import {getUrl} from "../../../../utils/urlUtils";
import CustomHead from "../../../../components/Head";

export default function Playlist() {
  const router = useRouter()
  const { roomId } = router.query

  const axiosClient = axios.create({
    withCredentials: true
  })

  const [playlists, setPlaylists] = useState({
    tracks_in_common: [],
    song_playing: '',
    creating_playlist: false,
    new_playlist: {}
  });

  const refresh = () => {
    // Do not refresh anything if no roomId exists
    if (!roomId) {
      return null;
    }

    axiosClient.get(getUrl('/rooms/' + roomId + '/playlists'))
      .then(resp => {
        setPlaylists(prevState => {
          return {
            ...prevState,
            ...resp.data,
          }
        })
      })
      .catch(error => {
        showErrorToastWithError("Failed to get playlists", error)
      })
  }

  useEffect(refresh, [roomId])

  const addPlaylist = () => {
    let confirmation = confirm("You are creating a playlist on your account, do you wish to continue?")

    if (!confirmation) {
      return
    }

    setPlaylists(prevState => {
      return {
        ...prevState,
        creating_playlist: true,
      }
    })

    axiosClient.post(getUrl('/rooms/' + roomId + '/playlists/add'))
      .then(resp => {
        const playlistName = resp.data.name

        setPlaylists(prevState => {
          return {
            ...prevState,
            creating_playlist: false,
            new_playlist: resp.data
          }
        })
        showSuccessToast(`Successfully created in spotify playlist "${playlistName}"`)
      })
      .catch(error => {
        showErrorToastWithError("Failed to create playlists in spotify", error)
      })
      .finally(() => {
        setPlaylists(prevState => {
          return {
            ...prevState,
            creating_playlist: false,
          }
        })
    })
  }

  const updateSongCallback = (song) => {
    setPlaylists(prevState => {
      return {
        ...prevState,
        song_playing: song
      }
    })
  }

  let music = (
    <h3 className="mt-5 text-center">No track in commons found... 😞</h3>
  );

  if (playlists.tracks_in_common) {
    music = playlists.tracks_in_common.sort((track1, track2) => {
      return getArtistsFromTrack(track1).localeCompare(getArtistsFromTrack(track2))
    }).map(track => {
      return (
        <PlaylistElem
          key={track.id}
          track={track}
          songPlaying={playlists.song_playing}
          updateSongCallback={updateSongCallback}/>
      )
    })
  }

  let player = (
    <ReactAudioPlayer
      src={playlists.song_playing}
      autoPlay
    />
  )

  let info;
  let addButton;

  if (playlists.tracks_in_common) {
    info = (
      <p className="font-weight-bold">
        {playlists.tracks_in_common.length} songs in common 🎉
      </p>
    )

    if (playlists.creating_playlist) {
      addButton = (
        <Button variant="warning" size="lg" className="mb-3" disabled>
          <Spinner animation="border" className="mr-2"/> Creating playlist
        </Button>
      )

    } else if (!isEmpty(playlists.new_playlist)) {
      let url = "#"

      if (playlists.new_playlist.spotify_url) {
        url = playlists.new_playlist.spotify_url
      }

      addButton = (
        (
          <Button variant="success" size="lg" className="mb-3" target="_blank" href={url}>
            Go to my new playlist ➡️
          </Button>
        )
      )

    } else {
      addButton = (
        (
          <OverlayTrigger
            key="top"
            placement="top"
            overlay={
              <Tooltip id={`tooltip-top`}>
                Playlist will be created in spotify and added to your playlists
              </Tooltip>
            }
          >
            <Button variant="outline-success" size="lg" className="mb-3" onClick={addPlaylist}>
              Add to my playlists
            </Button>
          </OverlayTrigger>
        )
      )
    }
  }

  return (
    <div className={styles.container}>
      <CustomHead />

      <main className={styles.main}>
        <h1>Playlists</h1>
        <p>Room #{roomId}</p>
        {info}
        {addButton}
        {music}
        {player}
      </main>

      <footer className={styles.footer}>
        Powered by{' '}
        <img src="/spotify.svg" alt="Spotify Logo" className={styles.logo} />
      </footer>

      <Toast/>
    </div>
  )
}