# ProfileManager Quick Reference Guide

## Import
```jsx
import { ProfileManager } from "../../../component/UI/Profile";
```

## Common Use Cases

### 1. Full Profile Management (Default)
```jsx
<ProfileManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onProfileSelect={(profile) => handleSelect(profile)}
  selectedProfileId={currentProfile?._id}
  title="Select Profile"
/>
```

### 2. Add Profile Only
```jsx
<ProfileManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  enabledOperations={{
    list: false,
    add: true,
    edit: false,
    delete: false,
  }}
/>
```

### 3. Edit Specific Profile
```jsx
<ProfileManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  enabledOperations={{
    list: false,
    add: false,
    edit: true,
    delete: false,
  }}
  profileToEdit={profileObject} // Must include kundli_ID
/>
```

### 4. Delete Specific Profile
```jsx
<ProfileManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  enabledOperations={{
    list: false,
    add: false,
    edit: false,
    delete: true,
  }}
  profileToDelete={kundliId} // String: profile's kundli_ID
/>
```

### 5. List with Add Only (No Edit/Delete)
```jsx
<ProfileManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onProfileSelect={(profile) => handleSelect(profile)}
  enabledOperations={{
    list: true,
    add: true,
    edit: false,
    delete: false,
  }}
/>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `false` | Controls modal visibility |
| `onClose` | function | `() => {}` | Callback when modal closes |
| `onProfileSelect` | function | `() => {}` | Callback when profile selected (list mode) |
| `selectedProfileId` | string | `null` | Currently selected profile ID |
| `title` | string | `"Select Profile"` | Title for listing modal |
| `enabledOperations` | object | All `true` | Controls which operations are enabled |
| `enabledOperations.list` | boolean | `true` | Enable profile listing |
| `enabledOperations.add` | boolean | `true` | Enable add profile |
| `enabledOperations.edit` | boolean | `true` | Enable edit profile |
| `enabledOperations.delete` | boolean | `true` | Enable delete profile |
| `autoOpenAdd` | boolean | `false` | Auto-open Add modal on mount |
| `autoOpenEdit` | boolean | `false` | Auto-open Edit modal on mount |
| `autoOpenDelete` | boolean | `false` | Auto-open Delete modal on mount |
| `profileToEdit` | object | `null` | Profile object to edit (requires `kundli_ID`) |
| `profileToDelete` | string | `null` | Profile `kundli_ID` to delete |

## Profile Object Structure

When passing `profileToEdit`, ensure it includes:

```javascript
{
  kundli_ID: "string",      // Required
  name: "string",
  gender: "male|female",
  relation: "string",
  day: number,
  month: number,
  year: number,
  hour: number,
  min: number,
  place: "string",
  lat: number,
  lon: number
}
```

## Auto-Open Behavior

### With Auto-Open Props
```jsx
// Auto-opens Add modal immediately
<ProfileManager
  isOpen={true}
  autoOpenAdd
  enabledOperations={{ list: false, add: true }}
/>

// Auto-opens Edit modal with provided profile
<ProfileManager
  isOpen={true}
  autoOpenEdit
  enabledOperations={{ list: false, edit: true }}
  profileToEdit={profile}
/>

// Auto-opens Delete confirmation with provided ID
<ProfileManager
  isOpen={true}
  autoOpenDelete
  enabledOperations={{ list: false, delete: true }}
  profileToDelete={kundliId}
/>
```

### Without Auto-Open (Direct Mode)
When `list: false` and parent provides data, modals open automatically:

```jsx
// Opens edit modal directly (no auto-open prop needed)
<ProfileManager
  isOpen={true}
  enabledOperations={{ list: false, edit: true }}
  profileToEdit={profile}
/>

// Opens delete modal directly (no auto-open prop needed)
<ProfileManager
  isOpen={true}
  enabledOperations={{ list: false, delete: true }}
  profileToDelete={kundliId}
/>
```

## Priority Order

When multiple operations are enabled with auto-open:
1. **Add** (highest priority - no data needed)
2. **Edit** (requires profile object)
3. **Delete** (requires profile ID)

## Common Patterns

### Pattern 1: Feature Flow with Profile Selection
```jsx
const [showProfile, setShowProfile] = useState(false);
const [selectedProfile, setSelectedProfile] = useState(null);

const handleFeatureClick = () => {
  setShowProfile(true);
};

const handleProfileSelect = (profile) => {
  setSelectedProfile(profile);
  localStorage.setItem("selectedProfile", JSON.stringify(profile));
  navigate("/feature-route");
  setShowProfile(false);
};

<ProfileManager
  isOpen={showProfile}
  onClose={() => setShowProfile(false)}
  onProfileSelect={handleProfileSelect}
/>
```

### Pattern 2: Quick Add Profile
```jsx
const [showAdd, setShowAdd] = useState(false);

<button onClick={() => setShowAdd(true)}>
  Add New Profile
</button>

<ProfileManager
  isOpen={showAdd}
  onClose={() => setShowAdd(false)}
  enabledOperations={{ list: false, add: true }}
/>
```

### Pattern 3: Edit from Profile Card
```jsx
const handleEdit = (profile) => {
  setProfileToEdit(profile);
  setShowEdit(true);
};

<ProfileManager
  isOpen={showEdit}
  onClose={() => setShowEdit(false)}
  enabledOperations={{ list: false, edit: true }}
  profileToEdit={profileToEdit}
/>
```

### Pattern 4: Delete Confirmation
```jsx
const handleDelete = (kundliId) => {
  setProfileId(kundliId);
  setShowDelete(true);
};

<ProfileManager
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  enabledOperations={{ list: false, delete: true }}
  profileToDelete={profileId}
/>
```

## Notes

- All operations respect `enabledOperations` configuration
- Parent-provided data takes precedence over auto-fetched profiles
- Backward compatible with existing implementations
- No breaking changes to existing code
