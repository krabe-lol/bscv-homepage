import type { Schema, Struct } from '@strapi/strapi';

export interface AddressAddress extends Struct.ComponentSchema {
  collectionName: 'components_address_addresses';
  info: {
    displayName: 'Adresse';
    icon: 'pinMap';
  };
  attributes: {
    city: Schema.Attribute.String;
    street: Schema.Attribute.String;
  };
}

export interface ClassGroupClassGroup extends Struct.ComponentSchema {
  collectionName: 'components_class_group_class_groups';
  info: {
    description: 'Eine Klasse pro Zeile, "---" als Trenner';
    displayName: 'Klassengruppe';
    icon: 'bulletList';
  };
  attributes: {
    classes: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface ColorColor extends Struct.ComponentSchema {
  collectionName: 'components_color_colors';
  info: {
    displayName: 'Farbe';
    icon: 'paintBrush';
  };
  attributes: {
    hex: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String;
  };
}

export interface ContactContact extends Struct.ComponentSchema {
  collectionName: 'components_contact_contacts';
  info: {
    displayName: 'Anschrift';
    icon: 'pinMap';
  };
  attributes: {
    address: Schema.Attribute.Component<'address.address', false>;
    email: Schema.Attribute.Email;
    mobile: Schema.Attribute.String;
    name: Schema.Attribute.String;
    phone: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'address.address': AddressAddress;
      'class-group.class-group': ClassGroupClassGroup;
      'color.color': ColorColor;
      'contact.contact': ContactContact;
    }
  }
}
