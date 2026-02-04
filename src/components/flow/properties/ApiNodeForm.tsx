import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ApiNodeFormProps {
  node: Node;
  onDataChange: (key: string, value: unknown) => void;
}

interface Header {
  key: string;
  value: string;
}

export function ApiNodeForm({ node, onDataChange }: ApiNodeFormProps) {
  const { t } = useLanguage();
  const data = node.data as Record<string, unknown>;

  const method = (data.apiMethod as string) || 'GET';
  const headers = (data.headers as Header[]) || [];

  const addHeader = () => {
    onDataChange('headers', [...headers, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: value };
    onDataChange('headers', updated);
  };

  const removeHeader = (index: number) => {
    onDataChange('headers', headers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input
          id="label"
          value={(data.label as string) || ''}
          onChange={(e) => onDataChange('label', e.target.value)}
          placeholder={t('flowEditor.nodes.api')}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 space-y-2">
          <Label htmlFor="apiMethod">{t('flowEditor.properties.apiMethod')}</Label>
          <Select
            value={method}
            onValueChange={(value) => onDataChange('apiMethod', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border z-50">
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="HEAD">HEAD</SelectItem>
              <SelectItem value="OPTIONS">OPTIONS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="apiUrl">{t('flowEditor.properties.apiUrl')}</Label>
          <Input
            id="apiUrl"
            value={(data.apiUrl as string) || ''}
            onChange={(e) => onDataChange('apiUrl', e.target.value)}
            placeholder="https://api.example.com/{{input.endpoint}}"
          />
        </div>
      </div>

      <Separator />

      {/* Headers */}
      <Accordion type="single" collapsible defaultValue="headers">
        <AccordionItem value="headers" className="border-none">
          <AccordionTrigger className="py-2 text-sm">
            {t('flowEditor.properties.headers')} ({headers.length})
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder={t('flowEditor.properties.headerKey')}
                  className="flex-1"
                />
                <Input
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder={t('flowEditor.properties.headerValue')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHeader(index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHeader}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('flowEditor.properties.addHeader')}
            </Button>
            
            {/* Common headers presets */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDataChange('headers', [...headers, { key: 'Content-Type', value: 'application/json' }])}
                className="text-xs"
              >
                + Content-Type: JSON
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDataChange('headers', [...headers, { key: 'Authorization', value: 'Bearer {{secrets.API_TOKEN}}' }])}
                className="text-xs"
              >
                + Authorization
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Request Body */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <Accordion type="single" collapsible defaultValue="body">
          <AccordionItem value="body" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              {t('flowEditor.properties.requestBody')}
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="bodyType">{t('flowEditor.properties.bodyType')}</Label>
                <Select
                  value={(data.bodyType as string) || 'json'}
                  onValueChange={(value) => onDataChange('bodyType', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="form">Form Data</SelectItem>
                    <SelectItem value="text">Raw Text</SelectItem>
                    <SelectItem value="none">{t('flowEditor.properties.noBody')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(data.bodyType as string) !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="requestBody">{t('flowEditor.properties.body')}</Label>
                  <Textarea
                    id="requestBody"
                    value={
                      typeof data.requestBody === 'object'
                        ? JSON.stringify(data.requestBody, null, 2)
                        : (data.requestBody as string) || ''
                    }
                    onChange={(e) => {
                      if ((data.bodyType as string) === 'json') {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          onDataChange('requestBody', parsed);
                        } catch {
                          onDataChange('requestBody', e.target.value);
                        }
                      } else {
                        onDataChange('requestBody', e.target.value);
                      }
                    }}
                    placeholder='{"key": "{{input.value}}"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('flowEditor.properties.bodyHint')}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Query Parameters */}
      <Accordion type="single" collapsible>
        <AccordionItem value="query" className="border-none">
          <AccordionTrigger className="py-2 text-sm">
            {t('flowEditor.properties.queryParams')}
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="queryParams">{t('flowEditor.properties.queryParams')}</Label>
              <Textarea
                id="queryParams"
                value={
                  typeof data.queryParams === 'object'
                    ? JSON.stringify(data.queryParams, null, 2)
                    : (data.queryParams as string) || ''
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onDataChange('queryParams', parsed);
                  } catch {
                    onDataChange('queryParams', e.target.value);
                  }
                }}
                placeholder='{"page": "1", "limit": "{{input.limit}}"}'
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Advanced Options */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border-none">
          <AccordionTrigger className="py-2 text-sm">
            {t('flowEditor.properties.advancedOptions')}
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {/* Timeout */}
            <div className="space-y-2">
              <Label htmlFor="timeout">{t('flowEditor.properties.timeout')}</Label>
              <Input
                id="timeout"
                type="number"
                value={(data.timeout as number) || 30000}
                onChange={(e) => onDataChange('timeout', parseInt(e.target.value) || 30000)}
                min={1000}
                max={300000}
              />
              <p className="text-xs text-muted-foreground">
                {t('flowEditor.properties.timeoutHint')}
              </p>
            </div>

            {/* Retry configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="retryCount">{t('flowEditor.properties.retryCount')}</Label>
                <Input
                  id="retryCount"
                  type="number"
                  value={(data.retryCount as number) || 0}
                  onChange={(e) => onDataChange('retryCount', parseInt(e.target.value) || 0)}
                  min={0}
                  max={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryDelay">{t('flowEditor.properties.retryDelay')}</Label>
                <Input
                  id="retryDelay"
                  type="number"
                  value={(data.retryDelay as number) || 1000}
                  onChange={(e) => onDataChange('retryDelay', parseInt(e.target.value) || 1000)}
                  min={100}
                  max={60000}
                />
              </div>
            </div>

            {/* Response handling */}
            <div className="space-y-2">
              <Label htmlFor="responseType">{t('flowEditor.properties.responseType')}</Label>
              <Select
                value={(data.responseType as string) || 'json'}
                onValueChange={(value) => onDataChange('responseType', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="blob">Blob</SelectItem>
                  <SelectItem value="arrayBuffer">ArrayBuffer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Follow redirects */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="followRedirects">{t('flowEditor.properties.followRedirects')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('flowEditor.properties.followRedirectsHint')}
                </p>
              </div>
              <Switch
                id="followRedirects"
                checked={(data.followRedirects as boolean) ?? true}
                onCheckedChange={(checked) => onDataChange('followRedirects', checked)}
              />
            </div>

            {/* Throw on error */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="throwOnError">{t('flowEditor.properties.throwOnError')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('flowEditor.properties.throwOnErrorHint')}
                </p>
              </div>
              <Switch
                id="throwOnError"
                checked={(data.throwOnError as boolean) ?? true}
                onCheckedChange={(checked) => onDataChange('throwOnError', checked)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
