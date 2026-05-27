# Prisma Self-Relations — In-Depth Explanation

## What Is a Self-Relation?

A **self-relation** is when a database model has a relationship with itself. It's also called a **recursive relationship**.

Think of it like a family tree: every person has a parent and can have children. Both are the same type — "Person" — but they're connected in a hierarchy.

## Real-World Examples

### 1. Categories (our use case)

```
Electronics
├── Laptops
│   └── Gaming Laptops
├── Phones
│   ├── iPhone
│   └── Android
└── Accessories
```

Every category has exactly **one parent** (except top-level ones). Every category can have **many children** (or none).

### 2. Employee- Manager Hierarchy

```
CEO
├── VP of Engineering
│   ├── Engineering Manager 1
│   │   ├── Developer A
│   │   └── Developer B
│   └── Engineering Manager 2
└── VP of Sales
    └── Sales Manager
```

Every employee (except the CEO) reports to **one manager**. Every manager can have **many direct reports**.

### 3. Comments on a Blog Post

```
Original Post
├── Comment 1
│   ├── Reply to Comment 1
│   └── Another Reply
└── Comment 2
    └── Reply to Comment 2
```

Each comment can be a reply to a **parent comment** (or be top-level). Each comment can have **many replies** (children).

### 4. Folder Structure on Your Computer

```
Documents/
├── Work/
│   ├── Projects/
│   │   ├── Project A
│   │   └── Project B
│   └── Reports/
└── Personal/
    └── Photos/
```

Each folder (except root) has exactly **one parent folder**. Each folder can have **many subfolders**.

---

## The Two Sides of a Self-Relation

Every relationship has two sides. In a self-relation, both sides live in the same model.

### Side 1: The `parent` field (optional, singular)

This answers: **"Who is above me?"**

- From a child's perspective, there is only ever **one** parent
- That's why it's a **single** field, not an array
- It's **optional** (`?`) because top-level items have no parent

For a category like "Laptops":
- `parent` = the Electronics category document

For a top-level category like "Electronics":
- `parent` = `null` (no parent)

In Prisma:
```prisma
parent Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
```

### Side 2: The `children` field (array)

This answers: **"Who is below me?"**

- From a parent's perspective, there can be **many** children
- That's why it's an **array**
- It can be empty if the category has no subcategories

For a category like "Electronics":
- `children` = [Laptops, Phones, Accessories]

For a category like "iPhone" (no subcategories):
- `children` = [] (empty array)

In Prisma:
```prisma
children Category[] @relation("CategoryHierarchy")
```

---

## The Link: `parentId` Field

Remember the `parentId` field we added?

```prisma
parentId  String?    @db.ObjectId
```

This is the **actual stored value** in the database. It literally stores the `id` of the parent category.

- **Laptops** document: `parentId` = `"abc123"` (which is the id of Electronics)
- **Electronics** document: `parentId` = `null`

The `parent` and `children` relation fields **don't store any data** in the database. They're virtual — Prisma uses them when you query to automatically:
- Fetch the parent document when you access `category.parent`
- Fetch all children when you access `category.children`

---

## Why the `@relation("CategoryHierarchy")` Name?

```prisma
parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
children Category[] @relation("CategoryHierarchy")
```

Prisma needs a way to know that `parent` and `children` are **two sides of the same relationship**, not two separate relationships.

The name `"CategoryHierarchy"` is arbitrary — you could call it `"Tree"` or `"ParentChild"`. The important thing is that both fields use the **same name** so Prisma connects them.

If you accidentally used different names:
```prisma
parent   Category?  @relation("RelA", ...)
children Category[] @relation("RelB")   ← WRONG! Prisma treats these as two separate relations
```

Prisma would create two separate, unrelated relationships and things would break.

---

## The `fields` and `references` Explained

```prisma
parent Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
```

- **`fields: [parentId]`** — "The foreign key is stored in the `parentId` column of this model"
- **`references: [id]`** — "That `parentId` value should match the `id` column of another category"

In plain English: "To find my parent, look at my `parentId` field, then find the category whose `id` matches that value."

---

## How It Works in Practice

### Creating a category tree

```javascript
// Create top-level category
const electronics = await prisma.category.create({
  data: { name: "Electronics", slug: "electronics" }
})

// Create subcategory — set parentId to electronics' id
const laptops = await prisma.category.create({
  data: { name: "Laptops", slug: "laptops", parentId: electronics.id }
})

// Create deeper subcategory
const gamingLaptops = await prisma.category.create({
  data: { name: "Gaming Laptops", slug: "gaming-laptops", parentId: laptops.id }
})
```

### Querying with includes

```javascript
// Get a category with its parent
const category = await prisma.category.findUnique({
  where: { id: someId },
  include: { parent: true }
})
// Result: { id, name, parent: { id, name, ... } }

// Get a category with all its children
const category = await prisma.category.findUnique({
  where: { id: someId },
  include: { children: true }
})
// Result: { id, name, children: [{ id, name, ... }, ...] }

// Get the full tree (multiple levels deep)
const allCategories = await prisma.category.findMany({
  include: { children: { include: { children: true } } }
})
```

---

## Diagram Summary

```
╔═══════════════════════════╗
║       Category            ║
╠═══════════════════════════╣
║ id: String  ←─────────────╗
║ name: String              ║
║ slug: String (unique)     ║
║ parentId: String?  ───────║─┐
║ isActive: Boolean         ║ │
║                           ║ │
║ parent: Category?  ───────║─┘  ← virtual, looks up by parentId
║ children: Category[] ─────║──  ← virtual, looks up where parentId = this.id
╚═══════════════════════════╝
     │
     │  ┌──────────────────────────┐
     └──│ parentId = "electronics" │── Laptops document
        └──────────────────────────┘
```

The key insight: **`parentId` is what physically exists in the database.** The `parent` and `children` fields are just convenience fields Prisma uses to make querying easier.

---

## Referential Actions on Self-Relations (The `onDelete` Constraint)

Prisma **requires** both `onDelete` and `onUpdate` to be `NoAction` on the field side of a self-relation:

```prisma
parent Category? @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
children Category[] @relation("CategoryHierarchy")
```

### Why only `NoAction`?

For self-relations, Prisma does not allow `Cascade` or `SetNull` — it will throw a validation error if you try. This is a safety constraint to prevent cyclic referential actions (imagine a loop where A cascades to B, B cascades to A).

### What happens when you delete a parent?

**The delete is blocked** by the database if children exist. You'll get a constraint error.

### How should your code handle it?

Before deleting a parent, promote children to root categories (set their `parentId` to `null`):

```typescript
async delete(id: string) {
  await this.prisma.category.updateMany({
    where: { parentId: id },
    data: { parentId: null },
  })
  return this.prisma.category.delete({ where: { id } })
}
```

This gives you the same effect as `SetNull` — children survive as top-level categories — but handled explicitly in your service layer rather than at the database level.
