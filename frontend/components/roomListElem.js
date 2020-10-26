import {Button, Card} from 'react-bootstrap';
import axios from "axios";
import {showErrorToastWithError} from "./toast";
import {useRouter} from "next/router";
import {getUrl} from "../utils/urlUtils";
import styles from "../styles/rooms/Rooms.module.scss";

export default function RoomListElem(props) {
  const router = useRouter()

  const axiosClient = axios.create({
    withCredentials: true
  })

  const addUserToRoom = () => {
    axiosClient.post(getUrl('/rooms/' + props.room.id + '/users'))
      .then(resp => {
        router.push('/rooms/' + props.room.id)
      })
      .catch(error => {
        showErrorToastWithError("Failed to join the room", error)
      })
  }

  let open;

  if (!props.room.locked) {
    open = (
      <div className={"float-right " + styles.lock}>🔓 Open</div>
    )

  } else {
    open = (
      <div className={"float-right " + styles.lock}>🔒 Locked</div>
    )
  }

  return (
    <Card className="mt-2 col-11 col-md-5">
      <Card.Body>
        <Card.Title>
          Room #{props.room.id}
          {open}
        </Card.Title>

        <Card.Text>
          Friends: {props.room.users.map(user => user.user_infos.name).join(", ")}
        </Card.Text>

        <Button variant="success" onClick={addUserToRoom}>
          Enter room  ➡️
        </Button>
      </Card.Body>
    </Card>
  )
}