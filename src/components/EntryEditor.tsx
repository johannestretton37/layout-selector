import React from 'react';
import { Paragraph, Typography } from '@contentful/forma-36-react-components';
import {
  EditorExtensionSDK,
  FieldAPI,
  FieldExtensionSDK,
} from '@contentful/app-sdk';
import { useState } from 'react';
import Field from './Field';
import { useEffect } from 'react';
import { EntryFieldAPI } from '@contentful/app-sdk';
import { EntryAPI } from '@contentful/app-sdk';
import { ContentType } from '@contentful/app-sdk';
import tokens from '@contentful/forma-36-tokens';

interface LayoutConfig {
  [key: string]: string[];
}

export interface FieldsConfig {
  [key: string]: LayoutConfig;
}

interface EditorProps {
  sdk: EditorExtensionSDK;
  fieldsConfig: FieldsConfig;
}

function visibleFieldKeysFor(
  contentType: ContentType,
  layout: string,
  config: FieldsConfig
) {
  if (layout === undefined) {
    return ['layout'];
  }
  if (!config[contentType.sys.id][layout]) {
    console.log(config);
    throw new Error(`The "${layout}" layout is not implemented yet`);
  }
  const allFields = contentType.fields.map((field) => field.id);
  return allFields.filter(
    (f: string) =>
      f === 'layout' || config[contentType.sys.id][layout].includes(f)
  );
}

function getFieldsForKeys(entry: EntryAPI, keys: string[]) {
  return keys.map((key) => entry.fields[key]);
}

const Entry = (props: EditorProps) => {
  const [visibleFields, setVisibleFields] = useState<EntryFieldAPI[]>([]);

  useEffect(() => {
    return props.sdk.entry.fields.layout.onValueChanged((layout: string) => {
      const fieldKeys = visibleFieldKeysFor(
        props.sdk.contentType,
        layout,
        props.fieldsConfig
      );
      setVisibleFields(getFieldsForKeys(props.sdk.entry, fieldKeys));
    });
  }, [props.sdk, props.fieldsConfig]);

  return (
    <>
      {visibleFields.map((field) => {
        return (
          <div
            key={field.id}
            style={
              field.id === 'layout'
                ? {
                    padding: `${tokens.spacingM} 0 1px`,
                    background: tokens.colorElementLightest,
                    borderBottom: `1px solid ${tokens.colorElementMid}`,
                  }
                : undefined
            }>
            <Field
              field={field as unknown as FieldAPI}
              sdk={props.sdk as FieldExtensionSDK}
            />
            <Typography
              style={{ padding: `${tokens.spacing2Xs} ${tokens.spacingXl}` }}>
              {field.id === 'layout' &&
                props.sdk.entry.fields.layout.getValue() && (
                  <Paragraph>
                    We could have a preview or a short description for the "
                    {props.sdk.entry.fields.layout.getValue()}" layout here...
                  </Paragraph>
                )}
            </Typography>
          </div>
        );
      })}
    </>
  );
};

export default Entry;
