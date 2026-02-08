

## Plan: Restructure CandidateDetail Card

### Changes in `src/components/ratings/CandidateDetail.tsx`

**1. Text and icon replacements**
- Replace `Swords` icon import with `Crown` from lucide-react
- Crown icon gets gold color: `text-amber-400`
- Button text: "Выбрать для конкурса" -> "Пригласить на подиум" / "Select for contest" -> "Invite to podium"
- Reverse state text: "Убрать из конкурса" -> "Убрать с подиума" / "Remove from contest" -> "Remove from podium"

**2. Strengths badges -> dedicated column in the info grid**
- Remove the standalone `flex-wrap` strengths block below the info grid
- Expand the info grid to `grid-cols-[1fr_1fr]` and add strengths as a vertical column of badges in the second column (rows span the full height)
- Layout: left column keeps Creator, Released, Parameters, Pricing rows; right column shows badges stacked vertically with `flex-wrap` for overflow

**3. Move "Available/Unavailable" badge to the podium invitation block (right column)**
- Remove the badge from the title row (next to model name)
- Place it at the top of the contest/podium section in the right column, before the role selector

**4. Move Type and Provider rows into the left info grid**
- Remove the Access section from the right column
- Add two new `InfoRow` entries to the left column grid: Type (BYOK / Lovable AI) and Provider
- The API key hint stays in the right column (podium block) when model is unavailable

### Resulting layout structure

```text
+--------------------------------------------------+------------------+
| [Logo]  Model Name                               | PODIUM           |
|                                                   |                  |
|  Creator: ...    | [Speed]          |              | [Available]      |
|  Released: ...   | [Multimodal]     |              | Role selector    |
|  Parameters: ... | [Coding]         |              | [Crown] Invite   |
|  Pricing: ...    | [Efficiency]     |              |   to podium      |
|  Type: BYOK      |                  |              |                  |
|  Provider: xAI   |                  |              |                  |
+--------------------------------------------------+------------------+
```

### Technical details

- File: `src/components/ratings/CandidateDetail.tsx`
- Replace `Swords` import with `Crown`
- Left column info grid changes to 3-column layout: `grid-cols-[auto_auto_1fr]` where first two columns are label-value InfoRows and third column is a vertical badge strip (using `row-span` or a separate nested flex container beside the grid)
- Simpler approach: keep the grid `grid-cols-2` for InfoRows, but place the strengths as an adjacent flex column next to the grid using a horizontal flex wrapper: `flex gap-4` -> `[grid of InfoRows]` + `[vertical badge column with flex-wrap]`
- Right column: remove Access section, add availability badge + keep contest UI renamed to "Podium"

