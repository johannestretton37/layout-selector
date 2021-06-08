import React, { SetStateAction } from 'react';
import {
  Paragraph,
  Heading,
  Typography,
  TextLink,
} from '@contentful/forma-36-react-components';
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

interface EditorProps {
  sdk: EditorExtensionSDK;
}

type Layout = 'Cards' | 'ExpandableCards' | 'Showcase';

const commonFields = [
  'layout',
  'heading',
  'headingSize',
  'headingAlignment',
  'theme',
  'cards',
];

const fieldsForLayout: { [key in Layout]: string[] } = {
  Cards: [...commonFields],
  ExpandableCards: [...commonFields],
  Showcase: [...commonFields, 'backgroundImage', 'backgroundColor', 'CTA'],
};

function visibleFieldKeysFor(contentType: ContentType, layout: Layout) {
  if (contentType.name !== 'CardsModule') {
    throw new Error('This Entry Editor is only configured for CardsModule');
  }
  if (layout === undefined) {
    return ['layout'];
  }
  if (!fieldsForLayout[layout]) {
    throw new Error(`The "${layout}" layout is not implemented yet`);
  }
  const allFields = contentType.fields.map((field) => field.id);
  return allFields.filter((f: string) => fieldsForLayout[layout].includes(f));
}

function getFieldsForKeys(entry: EntryAPI, keys: string[]) {
  return keys.map((key) => entry.fields[key]);
}

const Entry = (props: EditorProps) => {
  const [visibleFields, setVisibleFields] = useState<EntryFieldAPI[]>([]);

  useEffect(() => {
    return props.sdk.entry.fields.layout.onValueChanged((layout: Layout) => {
      const fieldKeys = visibleFieldKeysFor(props.sdk.contentType, layout);
      setVisibleFields(getFieldsForKeys(props.sdk.entry, fieldKeys));
    });
  }, [props.sdk]);

  return (
    <>
      {visibleFields.map((field) => {
        return (
          <div
            style={
              field.id === 'layout'
                ? {
                    padding: `${tokens.spacingM} 0 1px`,
                    background: tokens.colorElementLightest,
                    borderBottom: `1px solid ${tokens.colorElementDark}`,
                  }
                : undefined
            }>
            <Field
              key={field.id}
              field={field as unknown as FieldAPI}
              sdk={props.sdk as FieldExtensionSDK}
            />
            <Typography
              style={{ padding: `${tokens.spacing2Xs} ${tokens.spacingXl}` }}>
              {props.sdk.entry.fields.layout.getValue() && (
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
