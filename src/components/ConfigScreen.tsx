import React, { Component } from 'react';
import { AppExtensionSDK, FieldAPI } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Workbench,
  Paragraph,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Note,
} from '@contentful/forma-36-react-components';
import { Select, Option } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { FieldsConfig } from './EntryEditor';

export interface AppInstallationParameters {
  fieldsConfig: FieldsConfig;
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  /**
   * `parameters.fieldsConfig` is the final state that will be saved as config and available
   * in the EntryEditor
   *
   * Example:
   *
   * ```
   * const fieldsConfig = {
   *   cardsModule: { // A contentType that has a 'layout' property
   *     cards: ['title', 'layout'], // A layout
   *     showcase: ['title', 'showcaseSpecifics'], // Another layout
   *     // List all layouts and their visible fields here...
   *   },
   *   // More modules that use layout here...
   * }
   * ```
   */
  parameters: AppInstallationParameters;
  currentContentType: string;
  /**
   * All content types in the space that has a property named "layout"
   */
  layoutContentTypes: any[];
  contentTypes: any;
  fields: any[];
  availableLayouts: string[];
}

export default class Config extends Component<ConfigProps, ConfigState> {
  constructor(props: ConfigProps) {
    super(props);
    this.state = {
      currentContentType: '',
      layoutContentTypes: [],
      contentTypes: {},
      fields: [],
      availableLayouts: [],
      parameters: {
        fieldsConfig: {},
      },
    };

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure());
  }

  async componentDidMount() {
    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: AppInstallationParameters | null =
      await this.props.sdk.app.getParameters();

    // Init object to store configuration
    const fieldsConfig: { [key: string]: { [key: string]: string[] } } =
      parameters?.fieldsConfig || {};
    // Get content types from the space the app is installed in
    const spaceContentTypes = await this.props.sdk.space.getContentTypes();
    // Find content types with a "layout" property, ignore the rest
    const layoutContentTypes = spaceContentTypes.items
      .filter((contentType: any) =>
        contentType.fields.some((field: FieldAPI) => field.id === 'layout')
      )
      .map((contentType: any) => {
        // Find possible layout values, using the validations array
        const availableLayoutsObject = contentType.fields
          .find((field: FieldAPI) => field.id === 'layout')
          .validations?.find((validation: any) => {
            return validation.in !== undefined;
          });
        const availableLayouts = availableLayoutsObject.in;
        fieldsConfig[contentType.sys.id] =
          fieldsConfig[contentType.sys.id] || {};
        availableLayouts.forEach((layout: string) => {
          fieldsConfig[contentType.sys.id][layout] =
            fieldsConfig[contentType.sys.id][layout] || [];
        });
        return {
          friendlyName: contentType.name,
          value: contentType.sys.id,
          fields: contentType.fields,
          availableLayouts,
        };
      });

    this.setState(
      parameters
        ? {
            parameters: {
              fieldsConfig,
            },
            currentContentType: layoutContentTypes[0]?.value,
            contentTypes: {},
            layoutContentTypes,
            fields: layoutContentTypes[0]?.fields || [],
            availableLayouts: layoutContentTypes[0]?.availableLayouts || [],
          }
        : this.state,
      () => {
        // Once preparation has finished, call `setReady` to hide
        // the loading screen and present the app to a user.
        this.props.sdk.app.setReady();
      }
    );
  }

  onConfigure = async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    // const currentState = await this.props.sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: this.state.parameters,
      // parameters: {
      //   fieldsConfig: this.state.parameters.fieldsConfig,
      // },
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      // targetState: currentState,
    };
  };

  handleChange = (e: any) => {
    const selected = this.state.layoutContentTypes.find(
      (t) => t.value === e.target.value
    );
    this.setState((state) => ({
      ...state,
      currentContentType: e.target.value,
      fields: selected.fields,
      availableLayouts: selected.availableLayouts,
    }));
  };

  handleClick = (layout: string, fieldId: string) => {
    this.setState((state) => {
      let newFields = [];
      const fields =
        state.parameters.fieldsConfig[state.currentContentType][layout];
      if (fields.includes(fieldId)) {
        console.log(`Layout "${layout} will HIDE "${fieldId}" 🙈`);
        newFields = fields.filter((field) => field !== fieldId);
      } else {
        console.log(`Layout "${layout} will SHOW "${fieldId}" ✅`);
        newFields = [...fields, fieldId];
      }
      return {
        ...state,
        parameters: {
          ...state.parameters,
          fieldsConfig: {
            ...state.parameters.fieldsConfig,
            [state.currentContentType]: {
              ...state.parameters.fieldsConfig[state.currentContentType],
              [layout]: newFields,
            },
          },
        },
      };
    });
  };

  render() {
    return (
      <Workbench className={css({ margin: '80px' })}>
        <Form>
          <Heading>Layout Selector Setup</Heading>
          <Paragraph>
            Choose a Content Model that will use this Entry Editor app
          </Paragraph>

          {this.state.layoutContentTypes.length <= 0 && (
            <Note noteType="negative">
              Your space does not contain any Content Models with an id of
              "layout"
            </Note>
          )}
          <Select
            id="optionSelect"
            name="optionSelect"
            width="large"
            onChange={this.handleChange}>
            {this.state.layoutContentTypes.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.friendlyName}
              </Option>
            ))}
          </Select>

          <Paragraph>
            <b>NOTE:</b> The Content Model must have a field called "layout" to
            be visible here. The layout field should have a <i>validation</i>{' '}
            set to only accept certain values. These values will be listed here
            and you may choose to display or hide them when a user has chosen a
            layout.
          </Paragraph>

          <Note>
            Every time these settings are saved, you must add the entry editor
            to the content model again.
          </Note>

          <Table>
            <TableHead>
              <TableRow>
                {this.state.availableLayouts?.map((availableLayout) => {
                  return (
                    <TableCell key={availableLayout}>
                      {availableLayout}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {this.state.fields.length > 0 &&
                this.state.fields.map((field) => {
                  if (field.id === 'layout') {
                    return null;
                  }
                  return (
                    <TableRow key={field.id}>
                      {this.state.availableLayouts.map((availableLayout) => {
                        return (
                          <TableCell
                            key={availableLayout}
                            onClick={(e) =>
                              this.handleClick(availableLayout, field.id)
                            }>
                            {this.state.parameters.fieldsConfig[
                              this.state.currentContentType
                            ][availableLayout].includes(field.id)
                              ? '✅'
                              : '🚫'}
                            <span> {field.name}</span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </Form>
      </Workbench>
    );
  }
}
