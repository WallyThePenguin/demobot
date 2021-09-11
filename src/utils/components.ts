import {
  ActionRow,
  ButtonStyles,
  DiscordMessageComponentTypes,
  SelectMenuComponent,
  SelectOption,
} from "../../deps.ts";
import { shortenString, emoji, addableSelectMenuOption } from "./helpers.ts";

const snowflakeRegex = /[0-9]{17,19}/;

export class Components extends Array<ActionRow> {
  constructor(...args: ActionRow[]) {
    super(...args);

    return this;
  }

  addActionRow() {
    // Don't allow more than 5 Action Rows
    if (this.length === 5) return this;

    this.push({
      type: 1,
      components: [] as unknown as ActionRow["components"],
    });
    return this;
  }

  addButton(
    label: string,
    style: keyof typeof ButtonStyles,
    idOrLink: string,
    options?: { emoji?: string | bigint; disabled?: boolean }
  ) {
    // No Action Row has been created so do it
    if (!this.length) this.addActionRow();

    // Get the last Action Row
    let row = this[this.length - 1];

    // If the Action Row already has 5 buttons create a new one
    if (row.components.length === 5) {
      this.addActionRow();
      row = this[this.length - 1];

      // Apperandly there are already 5 Full Action Rows so don't add the button
      if (row.components.length === 5) return this;
    }

    row.components.push({
      type: DiscordMessageComponentTypes.Button,
      label: label,
      customId: style !== "Link" ? idOrLink : undefined,
      style: ButtonStyles[style],
      emoji: this.#stringToEmoji(options?.emoji),
      url: style === "Link" ? idOrLink : undefined,
      disabled: options?.disabled,
    });
    return this;
  }

  #stringToEmoji(emoji?: string | bigint) {
    if (!emoji) return;

    emoji = emoji.toString();

    // A snowflake id was provided
    if (snowflakeRegex.test(emoji)) {
      return {
        id: emoji.match(snowflakeRegex)![0],
      };
    }

    // A unicode emoji was provided
    return {
      name: emoji,
    };
  }
}
export class BaseComponent {
  customId?: string;
  type: DiscordMessageComponentTypes;
  constructor(type: keyof typeof DiscordMessageComponentTypes, id?: string) {
    this.customId = id;
    this.type = DiscordMessageComponentTypes[type];
  }
}

export class SelectMenu extends BaseComponent implements SelectMenuComponent {
  type: DiscordMessageComponentTypes.SelectMenu = DiscordMessageComponentTypes.SelectMenu;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  options: SelectOption[] = [];

  constructor() {
    super("SelectMenu");
    this.customId = "1";
  }

  /** A custom placeholder text if nothing is selected. Maximum 100 characters. */
  setPlaceholder(value: string) {
    this.placeholder = shortenString(value, 100);
    return this;
  }

  setCustomId(id: string) {
    this.customId = id;
    return this;
  }

  /** The minimum number of items that must be selected. Default 1. Between 1-25. */
  setMinValue(value: number) {
    if (value > 25) value = 25;
    if (value < 1) value = 1;
    this.minValues = value;
    return this;
  }

  /** The maximum number of items that can be selected. Default 1. Between 1-25. */
  setMaxValue(value: number) {
    if (value > 25) value = 25;
    if (value < 1) value = 1;
    this.maxValues = value;
    return this;
  }
  /** Adds a option
   *
   * **Max Lenghts**
   *
   * label - 25
   *
   * value - 100
   *
   * description - 50
   */
  addOption(label: string, value: string, selectedByDefault = false, description?: string, emoji?: emoji) {
    if (this.options.length == 25) return this;
    label = shortenString(label, 25);
    value = shortenString(value, 100);
    if (description) shortenString(description, 50);
    this.options.push({
      label: label,
      value: value,
      description: description,
      emoji: emoji,
      default: selectedByDefault,
    });
    return this;
  }

  /** Adds options in bulk
   *
   * **Max Lenghts**
   *
   * label - 25
   *
   * value - 100
   *
   * description - 50
   */
  addOptions(options: addableSelectMenuOption[]) {
    options.forEach((option) => {
      option.label = shortenString(option.label, 25);
      option.value = shortenString(option.value, 100);
      if (option.description) option.description = shortenString(option.description, 50);
      if (options.length == 25) return this;
      this.options.push({
        ...option,
        default: option.default || false,
      });
    });
    return this;
  }
}
