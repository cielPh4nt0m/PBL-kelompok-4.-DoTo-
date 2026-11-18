<?php

declare(strict_types=1);

namespace App\Support;

final class Enums
{
    public const TASK_STATUSES = ['idea', 'todo', 'in_progress', 'needs_review', 'done'];
    public const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
    public const ACTOR_CHANNELS = ['web', 'cli', 'agent'];
    public const HISTORY_ACTIONS = [
        'created',
        'status_changed',
        'priority_changed',
        'assignee_changed',
        'segment_changed',
        'field_updated',
        'comment',
        'archived',
    ];

    public const DEFAULT_STATUS = 'idea';
    public const DEFAULT_PRIORITY = 'medium';
}
