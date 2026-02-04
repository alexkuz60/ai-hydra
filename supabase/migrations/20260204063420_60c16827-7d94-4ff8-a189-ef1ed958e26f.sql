-- Add source column to flow_diagrams to distinguish user-created from pattern-generated diagrams
ALTER TABLE flow_diagrams 
ADD COLUMN source TEXT DEFAULT 'user' 
CHECK (source IN ('user', 'pattern'));