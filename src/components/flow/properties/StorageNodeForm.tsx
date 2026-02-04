import React from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StorageNodeFormProps {
  node: Node;
  onDataChange: (key: string, value: unknown) => void;
}

export function StorageNodeForm({ node, onDataChange }: StorageNodeFormProps) {
  const { t } = useLanguage();
  const data = node.data as Record<string, unknown>;

  const operation = (data.storageOperation as string) || 'download';

  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input
          id="label"
          value={(data.label as string) || ''}
          onChange={(e) => onDataChange('label', e.target.value)}
          placeholder={t('flowEditor.nodes.storage')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storageOperation">{t('flowEditor.properties.storageOperation')}</Label>
        <Select
          value={operation}
          onValueChange={(value) => onDataChange('storageOperation', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={t('flowEditor.properties.selectStorageOperation')} />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="download">{t('flowEditor.properties.storageDownload')}</SelectItem>
            <SelectItem value="upload">{t('flowEditor.properties.storageUpload')}</SelectItem>
            <SelectItem value="list">{t('flowEditor.properties.storageList')}</SelectItem>
            <SelectItem value="delete">{t('flowEditor.properties.storageDelete')}</SelectItem>
            <SelectItem value="move">{t('flowEditor.properties.storageMove')}</SelectItem>
            <SelectItem value="copy">{t('flowEditor.properties.storageCopy')}</SelectItem>
            <SelectItem value="getUrl">{t('flowEditor.properties.storageGetUrl')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Bucket Configuration */}
      <div className="space-y-2">
        <Label htmlFor="bucket">{t('flowEditor.properties.bucket')}</Label>
        <Input
          id="bucket"
          value={(data.bucket as string) || ''}
          onChange={(e) => onDataChange('bucket', e.target.value)}
          placeholder="message-files"
        />
        <p className="text-xs text-muted-foreground">
          {t('flowEditor.properties.bucketHint')}
        </p>
      </div>

      {/* Path Configuration */}
      <div className="space-y-2">
        <Label htmlFor="storagePath">{t('flowEditor.properties.storagePath')}</Label>
        <Input
          id="storagePath"
          value={(data.storagePath as string) || ''}
          onChange={(e) => onDataChange('storagePath', e.target.value)}
          placeholder="{{input.userId}}/documents/{{input.filename}}"
        />
        <p className="text-xs text-muted-foreground">
          {t('flowEditor.properties.storagePathHint')}
        </p>
      </div>

      {/* Move/Copy destination */}
      {(operation === 'move' || operation === 'copy') && (
        <div className="space-y-2">
          <Label htmlFor="destinationPath">{t('flowEditor.properties.destinationPath')}</Label>
          <Input
            id="destinationPath"
            value={(data.destinationPath as string) || ''}
            onChange={(e) => onDataChange('destinationPath', e.target.value)}
            placeholder="archive/{{input.filename}}"
          />
        </div>
      )}

      {/* Upload specific options */}
      {operation === 'upload' && (
        <Accordion type="single" collapsible defaultValue="upload">
          <AccordionItem value="upload" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              {t('flowEditor.properties.uploadOptions')}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Content Type */}
              <div className="space-y-2">
                <Label htmlFor="contentType">{t('flowEditor.properties.contentType')}</Label>
                <Select
                  value={(data.contentType as string) || 'auto'}
                  onValueChange={(value) => onDataChange('contentType', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="auto">{t('flowEditor.properties.autoDetect')}</SelectItem>
                    <SelectItem value="application/json">application/json</SelectItem>
                    <SelectItem value="text/plain">text/plain</SelectItem>
                    <SelectItem value="text/html">text/html</SelectItem>
                    <SelectItem value="text/csv">text/csv</SelectItem>
                    <SelectItem value="application/pdf">application/pdf</SelectItem>
                    <SelectItem value="image/png">image/png</SelectItem>
                    <SelectItem value="image/jpeg">image/jpeg</SelectItem>
                    <SelectItem value="custom">{t('flowEditor.properties.custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(data.contentType as string) === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customContentType">{t('flowEditor.properties.customContentType')}</Label>
                  <Input
                    id="customContentType"
                    value={(data.customContentType as string) || ''}
                    onChange={(e) => onDataChange('customContentType', e.target.value)}
                    placeholder="application/octet-stream"
                  />
                </div>
              )}

              {/* Cache Control */}
              <div className="space-y-2">
                <Label htmlFor="cacheControl">{t('flowEditor.properties.cacheControl')}</Label>
                <Input
                  id="cacheControl"
                  value={(data.cacheControl as string) || ''}
                  onChange={(e) => onDataChange('cacheControl', e.target.value)}
                  placeholder="max-age=3600"
                />
              </div>

              {/* Upsert option */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="upsert">{t('flowEditor.properties.upsertFile')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('flowEditor.properties.upsertFileHint')}
                  </p>
                </div>
                <Switch
                  id="upsert"
                  checked={(data.upsert as boolean) ?? true}
                  onCheckedChange={(checked) => onDataChange('upsert', checked)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* List specific options */}
      {operation === 'list' && (
        <Accordion type="single" collapsible defaultValue="list">
          <AccordionItem value="list" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              {t('flowEditor.properties.listOptions')}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Limit */}
              <div className="space-y-2">
                <Label htmlFor="limit">{t('flowEditor.properties.limit')}</Label>
                <Input
                  id="limit"
                  type="number"
                  value={(data.limit as number) || 100}
                  onChange={(e) => onDataChange('limit', parseInt(e.target.value) || 100)}
                  min={1}
                  max={1000}
                />
              </div>

              {/* Offset */}
              <div className="space-y-2">
                <Label htmlFor="offset">{t('flowEditor.properties.offset')}</Label>
                <Input
                  id="offset"
                  type="number"
                  value={(data.offset as number) || 0}
                  onChange={(e) => onDataChange('offset', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>

              {/* Sort by */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">{t('flowEditor.properties.sortBy')}</Label>
                <Select
                  value={(data.sortBy as string) || 'name'}
                  onValueChange={(value) => onDataChange('sortBy', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="name">{t('flowEditor.properties.sortByName')}</SelectItem>
                    <SelectItem value="created_at">{t('flowEditor.properties.sortByCreated')}</SelectItem>
                    <SelectItem value="updated_at">{t('flowEditor.properties.sortByUpdated')}</SelectItem>
                    <SelectItem value="last_accessed_at">{t('flowEditor.properties.sortByAccessed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search pattern */}
              <div className="space-y-2">
                <Label htmlFor="searchPattern">{t('flowEditor.properties.searchPattern')}</Label>
                <Input
                  id="searchPattern"
                  value={(data.searchPattern as string) || ''}
                  onChange={(e) => onDataChange('searchPattern', e.target.value)}
                  placeholder="*.pdf"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* URL options */}
      {operation === 'getUrl' && (
        <Accordion type="single" collapsible defaultValue="url">
          <AccordionItem value="url" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              {t('flowEditor.properties.urlOptions')}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Signed URL */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="signedUrl">{t('flowEditor.properties.signedUrl')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('flowEditor.properties.signedUrlHint')}
                  </p>
                </div>
                <Switch
                  id="signedUrl"
                  checked={(data.signedUrl as boolean) ?? false}
                  onCheckedChange={(checked) => onDataChange('signedUrl', checked)}
                />
              </div>

              {(data.signedUrl as boolean) && (
                <div className="space-y-2">
                  <Label htmlFor="expiresIn">{t('flowEditor.properties.expiresIn')}</Label>
                  <Input
                    id="expiresIn"
                    type="number"
                    value={(data.expiresIn as number) || 3600}
                    onChange={(e) => onDataChange('expiresIn', parseInt(e.target.value) || 3600)}
                    min={1}
                    max={604800}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('flowEditor.properties.expiresInHint')}
                  </p>
                </div>
              )}

              {/* Download option */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="download">{t('flowEditor.properties.downloadMode')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('flowEditor.properties.downloadModeHint')}
                  </p>
                </div>
                <Switch
                  id="download"
                  checked={(data.download as boolean) ?? false}
                  onCheckedChange={(checked) => onDataChange('download', checked)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
