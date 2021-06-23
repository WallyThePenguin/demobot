export interface Task {
  /** The name of the monitor */
  name: string;
  /** The amount of milliseconds to wait before running this again. */
  interval: number;
  /** Choose whether to disable the task by default or not. */
  disabled?: boolean;
  /** Choose whether you want to be notified when this Task is triggered. */
  log?: boolean;
  /** The main code that will be run when this monitor is triggered. */
  execute: () => unknown;
}
