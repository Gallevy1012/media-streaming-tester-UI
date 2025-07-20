import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput } from '../../common';
import type { SipComparator, SipMethod, MediaSourceType, ChannelState, SdpDto, Origin, Connection, Channel } from '../../../types';

interface SipComparatorEditorProps {
  value: SipComparator;
  onChange: (value: SipComparator) => void;
}

export const SipComparatorEditor: React.FC<SipComparatorEditorProps> = ({ value, onChange }) => {
  const handleFieldToggle = (field: keyof SipComparator, enabled: boolean) => {
    const newValue = { ...value };
    if (enabled) {
      // For expected_ fields, just set them to empty string
      // For actual_ fields, set them to empty string
      if (typeof newValue[field] === 'string' || newValue[field] === undefined) {
        newValue[field] = '' as any;
      } else if (typeof newValue[field] === 'number') {
        newValue[field] = 0 as any;
      } else if (typeof newValue[field] === 'boolean') {
        newValue[field] = false as any;
      } else {
        newValue[field] = {} as any;
      }
    } else {
      // Remove the field
      delete newValue[field];
    }
    onChange(newValue);
  };

  const handleFieldValueChange = (field: keyof SipComparator, newValue: string) => {
    const updatedComparator = { ...value };

    // Convert the value to the appropriate type based on field name
    if (field.includes('Number') || field.includes('CSeq')) {
      updatedComparator[field] = parseInt(newValue) as any;
    } else if (field.includes('NoToTag') || field.includes('NoFromTag') || field.includes('IsImrHeader')) {
      updatedComparator[field] = (newValue === 'true') as any;
    } else {
      updatedComparator[field] = newValue as any;
    }

    onChange(updatedComparator);
  };

  const isFieldEnabled = (field: keyof SipComparator) => {
    return value[field] !== undefined;
  };

  const getFieldValue = (field: keyof SipComparator) => {
    const val = value[field];
    if (val === undefined || val === null) return '';
    if (typeof val === 'boolean') return val.toString();
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  const headerFields = [
    { key: 'expected_SipMethod' as keyof SipComparator, label: 'Expected SIP Method' },
    { key: 'expected_SipStatusCode' as keyof SipComparator, label: 'Expected SIP Status Code' },
    { key: 'expected_CallId' as keyof SipComparator, label: 'Expected Call ID' },
    { key: 'expected_FromTag' as keyof SipComparator, label: 'Expected From Tag' },
    { key: 'expected_ToTag' as keyof SipComparator, label: 'Expected To Tag' },
    { key: 'expected_FromDisplayName' as keyof SipComparator, label: 'Expected From Display Name' },
    { key: 'expected_ToDisplayName' as keyof SipComparator, label: 'Expected To Display Name' },
    { key: 'expected_ContactUri' as keyof SipComparator, label: 'Expected Contact URI' },
    { key: 'expected_RequestUri' as keyof SipComparator, label: 'Expected Request URI' },
    { key: 'expected_CSeqMethod' as keyof SipComparator, label: 'Expected CSeq Method' },
    { key: 'expected_CSeqNumber' as keyof SipComparator, label: 'Expected CSeq Number' },
    { key: 'expected_InteractionKey' as keyof SipComparator, label: 'Expected Interaction Key' },
    { key: 'actual_CallId' as keyof SipComparator, label: 'Actual Call ID' },
  ];

  const sequenceFields = [
    { key: 'expected_NoToTag' as keyof SipComparator, label: 'Expected No To Tag' },
    { key: 'expected_NoFromTag' as keyof SipComparator, label: 'Expected No From Tag' },
    { key: 'expected_IsImrHeader' as keyof SipComparator, label: 'Expected Is IMR Header' },
    { key: 'expected_ImrTypeHeader' as keyof SipComparator, label: 'Expected IMR Type Header' },
    { key: 'expected_ImrIdHeader' as keyof SipComparator, label: 'Expected IMR ID Header' },
    { key: 'expected_ContactIdHeader' as keyof SipComparator, label: 'Expected Contact ID Header' },
  ];

  const sdpFields = [
    { key: 'expected_SdpDto' as keyof SipComparator, label: 'Expected SDP DTO' },
    { key: 'expected_SdpChannels' as keyof SipComparator, label: 'Expected SDP Channels' },
    { key: 'expected_ChannelsStatus' as keyof SipComparator, label: 'Expected Channels Status' },
    { key: 'expected_ChannelsConnection' as keyof SipComparator, label: 'Expected Channels Connection' },
    { key: 'expected_Origin' as keyof SipComparator, label: 'Expected Origin' },
    { key: 'expected_Connection' as keyof SipComparator, label: 'Expected Connection' },
    { key: 'expected_MediaSourceType' as keyof SipComparator, label: 'Expected Media Source Type' },
  ];

  // Define dropdown options for enum fields
  const sipMethodOptions = [
    { value: 'INVITE', label: 'INVITE' },
    { value: 'INVITE_REPLACES_HEADERS', label: 'INVITE_REPLACES_HEADERS' },
    { value: 'ACK', label: 'ACK' },
    { value: 'BYE', label: 'BYE' },
    { value: 'CANCEL', label: 'CANCEL' },
    { value: 'REGISTER', label: 'REGISTER' },
    { value: 'OPTIONS', label: 'OPTIONS' },
    { value: 'UPDATE', label: 'UPDATE' },
  ];

  const mediaSourceTypeOptions = [
    { value: 'SIP', label: 'SIP' },
    { value: 'DMCC', label: 'DMCC' },
  ];

  const channelStateOptions = [
    { value: 'SEND', label: 'SEND (sendonly)' },
    { value: 'RECEIVE', label: 'RECEIVE (recvonly)' },
    { value: 'SEND_AND_RECEIVE', label: 'SEND_AND_RECEIVE (sendrecv)' },
    { value: 'INACTIVE', label: 'INACTIVE' },
  ];

  // Define which fields should use dropdowns
  const enumFields = {
    expected_SipMethod: { options: sipMethodOptions, type: 'sipMethod' },
    expected_MediaSourceType: { options: mediaSourceTypeOptions, type: 'mediaSourceType' },
    expected_ChannelsStatus: { options: channelStateOptions, type: 'channelState' },
  };

  // Helper function to render the appropriate input component
  const renderInputComponent = (field: keyof SipComparator, fieldKey: string) => {
    const enumField = enumFields[fieldKey as keyof typeof enumFields];

    if (enumField) {
      return (
        <Dropdown
          id={fieldKey}
          label=""
          value={getFieldValue(field)}
          onChange={(value) => handleFieldValueChange(field, String(value))}
          options={enumField.options}
          placeholder="Select value"
          size="small"
        />
      );
    }

    // Handle boolean fields differently
    if (fieldKey.includes('NoToTag') || fieldKey.includes('NoFromTag') || fieldKey.includes('IsImrHeader')) {
      return (
        <Dropdown
          id={fieldKey}
          label=""
          value={getFieldValue(field)}
          onChange={(value) => handleFieldValueChange(field, String(value))}
          options={[
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
          ]}
          placeholder="Select boolean value"
          size="small"
        />
      );
    }

    // Handle complex objects with specialized components
    if (fieldKey === 'expected_SdpDto') {
      return renderSdpDtoEditor(field);
    }

    if (fieldKey === 'expected_Origin') {
      return renderOriginEditor(field);
    }

    if (fieldKey === 'expected_Connection') {
      return renderConnectionEditor(field);
    }

    if (fieldKey === 'expected_SdpChannels') {
      return renderChannelsEditor(field);
    }

    return (
      <TextInput
        id={fieldKey}
        label=""
        value={getFieldValue(field)}
        onChange={(value) => handleFieldValueChange(field, value)}
        placeholder="Enter value"
        size="small"
        multiline={fieldKey.includes('Content')}
        rows={fieldKey.includes('Content') ? 4 : 1}
      />
    );
  };

  // Specialized component for SdpDto editing
  const renderSdpDtoEditor = (field: keyof SipComparator) => {
    const currentValue = value[field] as SdpDto | undefined;
    const sdpValue: SdpDto = currentValue || {
      sessionVersion: 1,
      origin: {
        userName: '',
        sessionId: '',
        sessionVersion: 1,
        networkType: 'IN' as const,
        addressType: 'IP4' as const,
        ip: '',
      },
      sessionName: '',
      sessionInformation: '',
      connection: {
        networkType: 'IN' as const,
        addressType: 'IP4' as const,
        ip: '',
      },
      timing: {
        startTime: 0,
        stopTime: 0,
      },
      channels: [],
    };

    const updateSdpField = (fieldPath: string, newValue: any) => {
      const updatedSdp = { ...sdpValue };
      const keys = fieldPath.split('.');
      let current: any = updatedSdp;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = newValue;
      handleFieldValueChange(field, JSON.stringify(updatedSdp));
    };

    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>SDP Configuration</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <NumberInput
            id="sessionVersion"
            label="Session Version"
            value={sdpValue.sessionVersion}
            onChange={(value) => updateSdpField('sessionVersion', value)}
            min={1}
            size="small"
          />
          <TextInput
            id="sessionName"
            label="Session Name"
            value={sdpValue.sessionName}
            onChange={(value) => updateSdpField('sessionName', value)}
            size="small"
          />
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextInput
              id="sessionInformation"
              label="Session Information"
              value={sdpValue.sessionInformation || ''}
              onChange={(value) => updateSdpField('sessionInformation', value)}
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Origin</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <TextInput
            id="originUserName"
            label="User Name"
            value={sdpValue.origin.userName}
            onChange={(value) => updateSdpField('origin.userName', value)}
            size="small"
          />
          <TextInput
            id="originSessionId"
            label="Session ID"
            value={sdpValue.origin.sessionId}
            onChange={(value) => updateSdpField('origin.sessionId', value)}
            size="small"
          />
          <NumberInput
            id="originSessionVersion"
            label="Session Version"
            value={sdpValue.origin.sessionVersion}
            onChange={(value) => updateSdpField('origin.sessionVersion', value)}
            size="small"
          />
          <Dropdown
            id="originAddressType"
            label="Address Type"
            value={sdpValue.origin.addressType}
            onChange={(value) => updateSdpField('origin.addressType', value)}
            options={[
              { value: 'IP4', label: 'IP4' },
              { value: 'IP6', label: 'IP6' },
            ]}
            size="small"
          />
          <TextInput
            id="originIp"
            label="IP Address"
            value={sdpValue.origin.ip}
            onChange={(value) => updateSdpField('origin.ip', value)}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Connection</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Dropdown
            id="connectionAddressType"
            label="Address Type"
            value={sdpValue.connection.addressType}
            onChange={(value) => updateSdpField('connection.addressType', value)}
            options={[
              { value: 'IP4', label: 'IP4' },
              { value: 'IP6', label: 'IP6' },
            ]}
            size="small"
          />
          <TextInput
            id="connectionIp"
            label="IP Address"
            value={sdpValue.connection.ip}
            onChange={(value) => updateSdpField('connection.ip', value)}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Timing</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <NumberInput
            id="timingStartTime"
            label="Start Time"
            value={sdpValue.timing.startTime}
            onChange={(value) => updateSdpField('timing.startTime', value)}
            size="small"
          />
          <NumberInput
            id="timingStopTime"
            label="Stop Time"
            value={sdpValue.timing.stopTime}
            onChange={(value) => updateSdpField('timing.stopTime', value)}
            size="small"
          />
        </Box>
      </Box>
    );
  };

  // Specialized component for Origin editing
  const renderOriginEditor = (field: keyof SipComparator) => {
    const currentValue = value[field] as Origin | undefined;
    const originValue: Origin = currentValue || {
      userName: '',
      sessionId: '',
      sessionVersion: 1,
      networkType: 'IN' as const,
      addressType: 'IP4' as const,
      ip: '',
    };

    const updateOriginField = (fieldName: keyof Origin, newValue: any) => {
      const updatedOrigin = { ...originValue, [fieldName]: newValue };
      handleFieldValueChange(field, JSON.stringify(updatedOrigin));
    };

    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Origin Configuration</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <TextInput
            id="originUserName"
            label="User Name"
            value={originValue.userName}
            onChange={(value) => updateOriginField('userName', value)}
            size="small"
          />
          <TextInput
            id="originSessionId"
            label="Session ID"
            value={originValue.sessionId}
            onChange={(value) => updateOriginField('sessionId', value)}
            size="small"
          />
          <NumberInput
            id="originSessionVersion"
            label="Session Version"
            value={originValue.sessionVersion}
            onChange={(value) => updateOriginField('sessionVersion', value)}
            size="small"
          />
          <Dropdown
            id="originAddressType"
            label="Address Type"
            value={originValue.addressType}
            onChange={(value) => updateOriginField('addressType', value)}
            options={[
              { value: 'IP4', label: 'IP4' },
              { value: 'IP6', label: 'IP6' },
            ]}
            size="small"
          />
          <TextInput
            id="originIp"
            label="IP Address"
            value={originValue.ip}
            onChange={(value) => updateOriginField('ip', value)}
            size="small"
          />
        </Box>
      </Box>
    );
  };

  // Specialized component for Connection editing
  const renderConnectionEditor = (field: keyof SipComparator) => {
    const currentValue = value[field] as Connection | undefined;
    const connectionValue: Connection = currentValue || {
      networkType: 'IN' as const,
      addressType: 'IP4' as const,
      ip: '',
    };

    const updateConnectionField = (fieldName: keyof Connection, newValue: any) => {
      const updatedConnection = { ...connectionValue, [fieldName]: newValue };
      handleFieldValueChange(field, JSON.stringify(updatedConnection));
    };

    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Connection Configuration</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Dropdown
            id="connectionAddressType"
            label="Address Type"
            value={connectionValue.addressType}
            onChange={(value) => updateConnectionField('addressType', value)}
            options={[
              { value: 'IP4', label: 'IP4' },
              { value: 'IP6', label: 'IP6' },
            ]}
            size="small"
          />
          <TextInput
            id="connectionIp"
            label="IP Address"
            value={connectionValue.ip}
            onChange={(value) => updateConnectionField('ip', value)}
            size="small"
          />
        </Box>
      </Box>
    );
  };

  // Specialized component for Channels editing (up to 2 channels)
  const renderChannelsEditor = (field: keyof SipComparator) => {
    let channelsValue: Channel[] = [];

    try {
      const currentValue = value[field];
      if (typeof currentValue === 'string') {
        // If it's a string, try to parse it as JSON
        channelsValue = JSON.parse(currentValue) as Channel[];
      } else if (Array.isArray(currentValue)) {
        // If it's already an array, use it directly
        channelsValue = currentValue as Channel[];
      } else if (currentValue) {
        // If it's some other object, try to use it as an array
        channelsValue = [currentValue] as Channel[];
      }

      // Validate that it's actually an array of channels
      if (!Array.isArray(channelsValue)) {
        channelsValue = [];
      }
    } catch (error) {
      console.warn('Error parsing channels value:', error);
      channelsValue = [];
    }

    const updateChannels = (newChannels: Channel[]) => {
      handleFieldValueChange(field, JSON.stringify(newChannels));
    };

    const addChannel = () => {
      if (channelsValue.length < 2) {
        const newChannel: Channel = {
          mediaType: 'AUDIO',
          port: 62000,
          transportProtocol: 'RTP_AVP',
          connectionAddress: '',
          attributes: {},
        };
        updateChannels([...channelsValue, newChannel]);
      }
    };

    const removeChannel = (index: number) => {
      const newChannels = channelsValue.filter((_, i) => i !== index);
      updateChannels(newChannels);
    };

    const updateChannel = (index: number, fieldName: keyof Channel, newValue: any) => {
      const newChannels = [...channelsValue];
      if (newChannels[index]) {
        newChannels[index] = { ...newChannels[index], [fieldName]: newValue };
        updateChannels(newChannels);
      }
    };

    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">SDP Channels Configuration</Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addChannel}
            disabled={channelsValue.length >= 2}
            variant="outlined"
          >
            Add Channel ({channelsValue.length}/2)
          </Button>
        </Box>

        {channelsValue.map((channel, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Channel {index + 1}</Typography>
              <IconButton
                size="small"
                onClick={() => removeChannel(index)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Dropdown
                id={`channel-${index}-mediaType`}
                label="Media Type"
                value={channel.mediaType || 'AUDIO'}
                onChange={(value) => updateChannel(index, 'mediaType', value)}
                options={[
                  { value: 'AUDIO', label: 'Audio' },
                  { value: 'VIDEO', label: 'Video' },
                ]}
                size="small"
              />
              <NumberInput
                id={`channel-${index}-port`}
                label="Port"
                value={channel.port || 62000}
                onChange={(value) => updateChannel(index, 'port', value)}
                min={42000}
                max={62000}
                size="small"
              />
              <TextInput
                id={`channel-${index}-transportProtocol`}
                label="Transport Protocol"
                value={channel.transportProtocol || 'RTP_AVP'}
                onChange={(value) => updateChannel(index, 'transportProtocol', value)}
                size="small"
              />
              <TextInput
                id={`channel-${index}-connectionAddress`}
                label="Connection Address"
                value={channel.connectionAddress || ''}
                onChange={(value) => updateChannel(index, 'connectionAddress', value)}
                size="small"
              />
            </Box>
          </Box>
        ))}

        {channelsValue.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No channels configured. Click "Add Channel" to add up to 2 channels.
          </Typography>
        )}
      </Box>
    );
  };

  const renderFieldGroup = (title: string, fields: { key: keyof SipComparator; label: string }[]) => (
    <Accordion sx={{ mb: 1 }}>
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          '& .MuiAccordionSummary-content': { 
            justifyContent: 'flex-start',
            alignItems: 'center' 
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            order: -1,
            marginRight: 1,
            marginLeft: 0
          }
        }}
      >
        <Typography variant="subtitle1">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {fields.map(({ key, label }) => (
            <Box 
              key={key as string}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                minHeight: '48px',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1,
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <Box sx={{ minWidth: '350px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isFieldEnabled(key)}
                      onChange={(e) => handleFieldToggle(key, e.target.checked)}
                      size="small"
                    />
                  }
                  label={label}
                  sx={{ 
                    margin: 0,
                    width: '100%',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.875rem',
                      lineHeight: 1.2
                    }
                  }}
                />
              </Box>
              {isFieldEnabled(key) && (
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  {renderInputComponent(key, key as string)}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure SIP message comparison parameters. Enable fields by checking the box and provide their values.
        For enum fields (SIP Method, Media Source Type, Channel Status), use the dropdown to select values.
      </Typography>

      {renderFieldGroup('Header Fields', headerFields)}
      {renderFieldGroup('Sequence & Timing', sequenceFields)}
      {renderFieldGroup('SDP Fields', sdpFields)}
    </Box>
  );
};
