import 'codemirror/lib/codemirror.css';
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/field-editor-date/styles/styles.css';
import React from 'react';
import {
  Paragraph,
  Heading,
  Note,
} from '@contentful/forma-36-react-components';
import { FieldAPI, FieldExtensionSDK } from '@contentful/app-sdk';
import {
  Field as DefaultField,
  FieldWrapper as DefaultFieldWrapper,
} from '@contentful/default-field-editors';
import tokens from '@contentful/forma-36-tokens';

interface FieldProps {
  field: FieldAPI;
  sdk: FieldExtensionSDK;
}

const Field = (props: FieldProps) => {
  // these properties are mocked to make the entryFieldAPI
  // work, or at least not crash, when used in the place of FieldAPI
  const extendedField = props.field as any as FieldAPI;

  extendedField.onSchemaErrorsChanged = () => () => null;
  extendedField.setInvalid = () => null;
  extendedField.locale = props.sdk.locales.default;

  const fieldDetails = props.sdk.contentType.fields.find(
    ({ id }) => id === extendedField.id
  );

  const fieldEditorInterface = props.sdk.editor.editorInterface?.controls?.find(
    ({ fieldId }) => fieldId === extendedField.id
  );

  const extendedSDK: FieldExtensionSDK = {
    ...props.sdk,
    field: extendedField,
  };

  const renderHeading =
    extendedField.id === 'layout'
      ? (name: string) => (
          <>
            <Heading>{name}</Heading>
            <Paragraph>
              Choose a layout to display relevant fields only
            </Paragraph>
          </>
        )
      : undefined;

  if (fieldDetails && fieldEditorInterface) {
    return (
      <div style={{ fontFamily: tokens.fontStackPrimary }}>
        <DefaultFieldWrapper
          sdk={extendedSDK}
          renderHeading={renderHeading}
          name={fieldDetails.name}>
          <DefaultField
            sdk={extendedSDK}
            widgetId={fieldEditorInterface.widgetId}
          />
        </DefaultFieldWrapper>
      </div>
    );
  }

  return (
    <Note noteType="negative">
      Something went wrong. Try clicking on the "Editor" tab or reload the page.
    </Note>
  );
};

export default Field;
