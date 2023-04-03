import React from "react";

// Nested Routing: https://reacttraining.com/react-router/web/guides/quick-start
import {
  Switch,
  Route,
  // Link,
  useRouteMatch,
  useLocation,
} from "react-router-dom";
import { Segment } from "semantic-ui-react";

import LabelEdit from "../views/label/LabelEdit";
import LabelList from "../views/label/LabelList";

//=======================================
//				ARTIST PAGE & ROUTING
//=======================================
function LabelPage() {
  let match = useRouteMatch(); // {[0]=label} / {[1]=view} / [2]=labelId
  let urlChunks = useLocation().pathname.split("/");
  if (urlChunks[0] === "") {
    urlChunks.shift();
  }

  //---------------------
  // AVAILABLE ACTIONS:
  //---------------------

  // label/edit/{label_id}
  let labelId = urlChunks[1] === "edit" ? parseInt(urlChunks[2]) : null;

  // label/edit/add
  let add = urlChunks[2] === "add" ? true : false;

  // label/{letter}
  let currLetter = urlChunks[1] !== "edit" ? urlChunks[1] : null;

  return (
    <Switch>
      <Route path={`${match.path}/edit`}>
        <Segment id='labelEdit' className='page'>
          <LabelEdit add={add} labelId={labelId} />
        </Segment>
      </Route>
      <Route path={`${match.path}/:letter?`}>
        <Segment id='labelView' className='page'>
          <LabelList activeLetter={currLetter} />
        </Segment>
      </Route>
    </Switch>
  );
}

export default LabelPage;
