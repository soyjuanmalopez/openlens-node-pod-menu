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
    Button,
    Notifications,
  },
  Navigation,
} = Renderer;

const {
    Util,
    App,
} = Common;

interface PodShellMenuState {
  showUploadModal: boolean;
  selectedContainer?: string;
  selectedFile?: File;
  isUploading: boolean;
}

export class PodFileUploadMenu extends React.Component<Renderer.Component.KubeObjectMenuProps<Pod>, PodShellMenuState> {
  state: PodShellMenuState = {
    showUploadModal: false,
    isUploading: false,
  };

  fileInputRef = React.createRef<HTMLInputElement>();

  handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      this.setState({ selectedFile: file });
    }
  };

  handleUpload = async () => {
    const { object: pod } = this.props;
    const { selectedContainer, selectedFile } = this.state;

    if (!selectedContainer || !selectedFile) {
      Notifications.error("Missing required information for upload");
      return;
    }

    this.setState({ isUploading: true });

    try {

      const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";
    
       // Obtener el directorio del archivo seleccionado
       const fileDirectory = selectedFile.path.substring(0, selectedFile.path.lastIndexOf('\\') + 1);


        const fullCommand = `
        cd "${fileDirectory}"; if ($?) { ${kubectlPath} cp "${selectedFile.name}" "${pod.getNs()}/${pod.getName()}:/${selectedFile.name}" -c "${selectedContainer}" }
      `;      

  // Ejecutar el comando concatenado en la misma sesión
      await terminalStore.sendCommand(fullCommand, { enter: true });
       // Ejecutar el comando kubectl
       
      // Clean up the temporary file
      Notifications.ok(`File uploaded successfully to /${selectedFile.name}`);
      this.setState({ showUploadModal: false, selectedFile: undefined });
      Navigation.hideDetails();
    } catch (error) {
      console.error("Upload failed:", error);
      Notifications.error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.setState({ isUploading: false });
    }
  };

  render() {
    const { object, toolbar } = this.props;
    const { showUploadModal, selectedFile, isUploading } = this.state;
    const containers = object.getRunningContainers();

    if (!containers.length) return null;

    const modalStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: showUploadModal ? 'flex' : 'none',
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
        <MenuItem onClick={Util.prevDefault(() => this.setState({ selectedContainer: containers[0].name, showUploadModal: true  }))}>
          <Icon
            material="file_upload"
            interactive={toolbar}
            tooltip={toolbar && "Upload File to Pod"}
          />
          <span className="title">Upload File</span>
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
                        onClick={Util.prevDefault(()  => this.setState({ selectedContainer: name, showUploadModal: true }))}
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
              <Icon material="file_upload" />
              <h2 className="flex-grow">Upload File to Pod</h2>
              <Icon
                material="close"
                onClick={() => this.setState({ showUploadModal: false })}
                className="cursor-pointer"
              />
            </div>
            <div className="mt-4 mb-4">
              <input
                type="file"
                ref={this.fileInputRef}
                onChange={this.handleFileSelect}
              />
            </div>
        
            <div className="flex justify-end">
              <Button
                primary
                label={isUploading ? "Uploading..." : "Upload"}
                onClick={this.handleUpload}
                disabled={!selectedFile || isUploading}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}