import {
  SceneStoreService,
  StorableLayerType,
  StorableSceneType,
  VanillaSceneTransport,
} from "@bridged.xyz/client-sdk/lib";
import { upload } from "@bridged.xyz/client-sdk/lib/hosting";
import Button from "@material-ui/core/Button";
import LinearProgress from "@material-ui/core/LinearProgress";
import { ImageManifest } from "@reflect.bridged.xyz/core/lib";
import React from "react";
import { TransportableImageRepository } from "../../assets-repository";
import { ImageHostingRepository } from "../../assets-repository/hosting";
import {
  EK_COMPUTE_STARTED,
  EK_IMAGE_ASSET_REPOSITORY_MAP,
  EK_VANILLA_TRANSPORT,
} from "../constants/ek.constant";

interface State {
  loading: boolean;
  vanilla: VanillaSceneTransport;
}

export class GlobalizationScreen extends React.Component<any, State> {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      vanilla: undefined,
    };
    this.startCloud = this.startCloud.bind(this);
  }

  componentDidMount() {
    window.addEventListener("message", this.onMessage);
  }

  onMessage = (ev: MessageEvent) => {
    const msg = ev.data.pluginMessage;

    switch (msg.type) {
      case EK_COMPUTE_STARTED:
        this.setState(() => {
          return {
            loading: true,
          };
        });

      case EK_VANILLA_TRANSPORT:
        this.setState(() => {
          return {
            loading: false,
            vanilla: msg.data as VanillaSceneTransport,
          };
        });
        console.log("vanilla transport receiced from view", msg.data);
        break;

      case EK_IMAGE_ASSET_REPOSITORY_MAP:
        const imageRepo = msg.data as TransportableImageRepository;
        ImageHostingRepository.setRepository(imageRepo);
        break;
    }
  };

  async startCloud() {
    const hosted = await ImageHostingRepository.hostImages();
    console.log(hosted);

    const scene = this.state.vanilla.scene;
    const transport = this.state.vanilla;

    scene.layers.forEach((element) => {
      if (element.type == StorableLayerType.vanilla) {
        // the key source is set as template. we need to replace this with uploaded asset.
        const sourceKey = (element.data as ImageManifest).src;
        const uploadedSource = hosted[sourceKey];
        (element.data as ImageManifest).src = uploadedSource;
      }
    });

    const service = new SceneStoreService("", "");
    const serviceuploaded = await service.registerNewScene({
      nodeId: scene.nodeId,
      width: scene.width,
      height: scene.height,
      name: scene.name,
      tags: scene.tags,
      description: scene.description,
      projectId: "temp",
      layers: scene.layers,
      // todo
      cachedPreview: "",
      sceneType: StorableSceneType.screen,
      // todo
      fileId: "",
      // todo
      preview: "",
      backgroundColor: scene.backgroundColor,
    });
    console.log("serviceuploaded", serviceuploaded);

    const sceneId = serviceuploaded.data.id;

    // remote
    open(`https://console.bridged.xyz/globalization/?scene=${sceneId}`);
    // local
    // open(`http://localhost:3000/globalization/?scene=${sceneId}`);
  }

  render() {
    return (
      <div>
        <p>globalization</p>
        {this.state.loading ? <LinearProgress /> : <p>ready</p>}
        <pre>
          {this.state.vanilla
            ? JSON.stringify(this.state.vanilla, null, 4)
            : "nothing to load"}
        </pre>
        <Button onClick={this.startCloud}>edit on the cloud</Button>
      </div>
    );
  }
}
