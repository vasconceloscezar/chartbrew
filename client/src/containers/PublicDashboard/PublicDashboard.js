import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Button,
  Container,
  Dimmer, Divider, Form, Grid, Header, Icon, Input, Loader, Menu, Popup
} from "semantic-ui-react";
import { connect } from "react-redux";
import { SketchPicker } from "react-color";
import { createMedia } from "@artsy/fresnel";
import { Helmet } from "react-helmet";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import {
  getPublicDashboard as getPublicDashboardAction,
  getProject as getProjectAction,
  updateProject as updateProjectAction,
} from "../../actions/project";
import { blue } from "../../config/colors";
import Chart from "../Chart/Chart";

const AppMedia = createMedia({
  breakpoints: {
    mobile: 0,
    tablet: 768,
    computer: 1024,
  },
});
const { Media } = AppMedia;

function PublicDashboard(props) {
  const {
    getPublicDashboard, match, getProject, updateProject
  } = props;

  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [newChanges, setNewChanges] = useState({
    backgroundColor: "#1F77B4",
    titleColor: "black",
  });

  useEffect(() => {
    setLoading(true);
    _fetchProject();
  }, []);

  useEffect(() => {
    if (project.id) {
      setNewChanges({
        backgroundColor: project.backgroundColor || blue,
        titleColor: project.titleColor || "white",
        dashboardTitle: project.dashboardTitle || project.name,
      });
    }
  }, [project]);

  useEffect(() => {
    if (project.id
      && (newChanges.backgroundColor !== project.backgroundColor
      || newChanges.titleColor !== project.titleColor
      || newChanges.dashboardTitle !== project.dashboardTitle)
    ) {
      setIsSaved(false);
    }
  }, [newChanges]);

  const _fetchProject = () => {
    getPublicDashboard(match.params.brewName)
      .then((data) => {
        setProject(data);
        setLoading(false);

        // now get the project (mainly to check if the user can edit)
        getProject(data.id)
          .then(() => {
            setEditorVisible(true);
          })
          .catch(() => {});
      })
      .catch(() => {
        toast.error("Could not get the the dashboard data. Please try refreshing the page.");
      });
  };

  const _isPublic = () => {
    return project.Charts.filter((c) => c.public).length > 0;
  };

  const _onChangeTitleColor = () => {
    if (newChanges.titleColor === "black") {
      setNewChanges({ ...newChanges, titleColor: "white" });
    } else {
      setNewChanges({ ...newChanges, titleColor: "black" });
    }
  };

  const _onSaveChanges = () => {
    setSaveLoading(true);
    updateProject(project.id, newChanges)
      .then(() => {
        setSaveLoading(false);
        _fetchProject();
        setIsSaved(true);
        toast.success("The dashboard has been updated!");
      })
      .catch(() => {
        toast.error("Oh no! We couldn't update the dashboard. Please try again");
      });
  };

  return (
    <div>
      <Helmet>
        <style>
          {`
            body {
              background-color: ${newChanges.backgroundColor};
            }
          `}
        </style>
      </Helmet>
      <Dimmer active={loading}>
        <Loader active={loading}>
          Preparing the dashboard...
        </Loader>
      </Dimmer>
      {editorVisible && (
        <Menu fixed="top" color="blue" inverted size="large">
          <Menu.Item icon as={Link} to={`/${project.team_id}/${project.id}/dashboard`}>
            <Popup
              trigger={(
                <Icon name="arrow left" />
              )}
              content="Back to your dashboard"
            />
          </Menu.Item>
          {!isSaved && (
            <Menu.Item>
              <Media at="mobile">
                <Button
                  secondary
                  content="Save"
                  size="small"
                  icon="checkmark"
                  loading={saveLoading}
                  onClick={_onSaveChanges}
                />
              </Media>
              <Media greaterThan="mobile">
                <Button
                  secondary
                  content="Save changes"
                  size="small"
                  icon="checkmark"
                  loading={saveLoading}
                  onClick={_onSaveChanges}
                />
              </Media>
            </Menu.Item>
          )}
          <Menu.Menu position="right">
            <Menu.Item icon>
              <Popup
                trigger={(
                  <Icon name="image" />
                )}
                on="click"
                position="bottom right"
              >
                <SketchPicker
                  color={newChanges.backgroundColor}
                  onChangeComplete={(color) => {
                    const rgba = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
                    setNewChanges({ ...newChanges, backgroundColor: rgba });
                  }}
                />
              </Popup>
            </Menu.Item>
            <Menu.Item icon onClick={() => setEditingTitle(true)}>
              <Popup
                trigger={(
                  <Icon name="pencil" />
                )}
                content="Edit your public dashboard title"
              />
            </Menu.Item>
            <Menu.Item icon onClick={_onChangeTitleColor}>
              <Popup
                trigger={(
                  <Icon name="adjust" />
                )}
                content="Toggle white/black title"
              />
            </Menu.Item>
          </Menu.Menu>
        </Menu>
      )}

      {project.Charts && project.Charts.length > 0 && _isPublic()
        && (
          <div style={{ padding: 20, paddingTop: 50 }}>
            {!editorVisible && (
              <Header
                textAlign="center"
                size="huge"
                style={styles.dashboardTitle(project.titleColor)}
              >
                {project.dashboardTitle || project.name}
              </Header>
            )}

            {editorVisible && <Divider hidden />}
            {!editingTitle && editorVisible && (
              <Header
                textAlign="center"
                size="huge"
                style={styles.dashboardTitle(newChanges.titleColor)}
              >
                {newChanges.dashboardTitle || project.dashboardTitle || project.name}
              </Header>
            )}

            {editingTitle && editorVisible && (
              <Container fluid textAlign="center">
                <Form style={{ display: "inline-block" }} size="big">
                  <Form.Group>
                    <Form.Field>
                      <Input
                        placeholder="Enter a title"
                        value={newChanges.dashboardTitle || project.dashboardTitle || project.name}
                        onChange={(e, data) => {
                          setNewChanges({ ...newChanges, dashboardTitle: data.value });
                        }}
                      />
                    </Form.Field>
                    <Form.Field>
                      <Button
                        secondary
                        icon
                        labelPosition="right"
                        type="submit"
                        onClick={() => setEditingTitle(false)}
                        size="big"
                      >
                        <Icon name="checkmark" />
                        Save
                      </Button>
                    </Form.Field>
                  </Form.Group>
                </Form>
              </Container>
            )}

            <Divider hidden />
            <Grid stackable centered style={styles.mainGrid}>
              {project.Charts.map((chart) => {
                if (chart.draft) return (<span style={{ display: "none" }} key={chart.id} />);
                if (!chart.public) return (<span style={{ display: "none" }} key={chart.id} />);

                return (
                  <Grid.Column width={chart.chartSize * 4} key={chart.id} style={styles.chartGrid}>
                    <Chart
                      isPublic
                      chart={chart}
                      charts={project.Charts}
                    />
                  </Grid.Column>
                );
              })}
              <Grid.Column textAlign="center" style={{ color: newChanges.titleColor }} width={16}>
                {"Powered by "}
                <a href="https://chartbrew.com" target="_blank" rel="noopener noreferrer">Chartbrew</a>
              </Grid.Column>
            </Grid>
          </div>
        )}
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnVisibilityChange
        draggable
        pauseOnHover
        transition={Flip}
      />
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: blue,
    height: window.innerHeight,
    paddingBottom: 100,
  },
  brewBadge: {
    position: "absolute",
    top: 5,
    left: 5,
  },
  mainContent: {
    marginTop: 0,
  },
  dashboardTitle: (color) => ({
    color: color || "black",
  }),
};

PublicDashboard.propTypes = {
  getPublicDashboard: PropTypes.func.isRequired,
  getProject: PropTypes.func.isRequired,
  updateProject: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
};

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch) => ({
  getPublicDashboard: (brewName) => dispatch(getPublicDashboardAction(brewName)),
  getProject: (projectId) => dispatch(getProjectAction(projectId)),
  updateProject: (projectId, data) => dispatch(updateProjectAction(projectId, data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PublicDashboard);
