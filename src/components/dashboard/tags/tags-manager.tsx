"use client";

import { useState } from "react";
import { dashboardApiRequest } from "@/lib/dashboard-api";
import { showToast } from "@/components/ui/toast";
import type { Tag, TagsManagerProps } from "@/types/customer";
import TagCreateForm from "./tag-create-form";
import TagList from "./tag-list";
import TagAssignmentPanel from "./tag-assignment-panel";

export default function TagsManager({
  initialTags,
  initialCustomers,
  initialCustomerTags,
}: TagsManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [customerTags, setCustomerTags] = useState(initialCustomerTags);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [busy, setBusy] = useState(false);

  function handleTagCreated(newTag: Tag) {
    setTags((current) =>
      [...current, newTag].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async function handleDelete(tag: Tag) {
    const confirmed = window.confirm(
      `Delete the tag "${tag.name}"? This will also remove it from all customers.`,
    );

    if (!confirmed) return;

    setBusy(true);

    const { error } = await dashboardApiRequest<{ success: boolean }>(
      "/api/dashboard/tags",
      { method: "DELETE", body: { id: tag.id } },
    );

    setBusy(false);

    if (error) {
      showToast("Could not delete tag", error, "error");
      return;
    }

    setTags((current) => current.filter((item) => item.id !== tag.id));
    if (selectedTagId === tag.id) {
      setSelectedTagId("");
    }
    showToast("Tag deleted", "Tag delete হয়েছে।");
  }

  return (
    <>
      <TagCreateForm
        busy={busy}
        setBusy={setBusy}
        onTagCreated={handleTagCreated}
      />

      <TagAssignmentPanel
        tags={tags}
        initialCustomers={initialCustomers}
        customerTags={customerTags}
        setCustomerTags={setCustomerTags}
        selectedTagId={selectedTagId}
        setSelectedTagId={setSelectedTagId}
        busy={busy}
        setBusy={setBusy}
      />

      <TagList tags={tags} busy={busy} onDeleteTag={handleDelete} />
    </>
  );
}
