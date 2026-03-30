import { renderRemoteWidget } from "../widget";

const mount = document.getElementById("remote-standalone");
renderRemoteWidget(mount, {
  from: "remote standalone page",
  loadedAt: new Date().toISOString(),
});
