import React from "react";
import { Renderer, Common } from "@k8slens/extensions";

type Pod = Renderer.K8sApi.Pod;

const {
  Component: {
    terminalStore,
    MenuItem,
    Icon,
    SubMenu,
    StatusBrick,
    Input,
    Button,
  },
  Navigation,
} = Renderer;

const {
  Util,
  App,
} = Common;

interface PodShellMenuState {
  showPathInput: boolean;
  selectedContainer?: string;
  filePath: string;
}

export class PodFileDownloadMenu extends React.Component<Renderer.Component.KubeObjectMenuProps<Pod>, PodShellMenuState> {
  state: PodShellMenuState = {
    showPathInput: false,
    filePath: "",
  };

  handleDownload = async () => {
    const { object: pod } = this.props;
    const { selectedContainer, filePath } = this.state;

    if (!selectedContainer || !filePath) return;

    const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";

    const commandParts2 = [
      kubectlPath,
      "cp",
      `${pod.getNs()}/${pod.getName()}:${filePath}`,
      `./${filePath.split('/').pop()}`,
    ];

    await terminalStore.sendCommand(commandParts2.join(" "), { enter: true });


    this.setState({ showPathInput: false, filePath: "" });
    Navigation.hideDetails();
  };

  render() {
    const { object, toolbar } = this.props;
    const { showPathInput, filePath } = this.state;
    const containers = object.getRunningContainers();

    if (!containers.length) return null;

    const modalStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: showPathInput ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    };

    const modalContentStyle: React.CSSProperties = {
      backgroundColor: 'var(--mainBackground)',
      padding: '20px',
      borderRadius: '8px',
      width: '400px',
      maxWidth: '90%',
    };

    return (
      <>
        <MenuItem onClick={Util.prevDefault(() => this.setState({ selectedContainer: containers[0].name, showPathInput: true }))}>
          <Icon
            material="file_download"
            interactive={toolbar}
            tooltip={toolbar && "Download File from Pod"}
          />
          <span className="title">Download File</span>
          {containers.length > 1 && (
            <>
              <Icon className="arrow" material="keyboard_arrow_right" />
              <SubMenu>
                {
                  containers.map(container => {
                    const { name } = container;
                    return (
                      <MenuItem
                        key={name}
                        onClick={Util.prevDefault(() => this.setState({ selectedContainer: name, showPathInput: true }))}
                        className="flex align-center"
                      >
                        <StatusBrick />
                        <span>{name}</span>
                      </MenuItem>
                    );
                  })
                }
              </SubMenu>
            </>
          )}
        </MenuItem>

        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div className="flex align-center gaps">
              <Icon material="file_download" />
              <h2 className="flex-grow">Download File from Pod</h2>
              <Icon
                material="close"
                onClick={() => this.setState({ showPathInput: false })}
                className="cursor-pointer"
              />
            </div>
            <div className="mt-4 mb-4">
              <Input
                placeholder="Enter file path (e.g. /var/log/app.log)"
                value={filePath}
                onChange={(value) => this.setState({ filePath: value })}
              />
            </div>
            <div className="flex justify-end">
              <Button
                primary
                label="Download"
                onClick={this.handleDownload}
                disabled={!filePath}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}