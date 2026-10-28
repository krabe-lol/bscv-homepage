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

export interface StatStat extends Struct.ComponentSchema {
  collectionName: 'components_stat_stats';
  info: {
    description: 'Eine Kennzahl mit Bezeichnung, Wert und Symbol';
    displayName: 'Kennzahl';
    icon: 'chartBubble';
  };
  attributes: {
    icon: Schema.Attribute.Enumeration<
      [
        'Ausbildung',
        'Auszeichnung',
        'Auto',
        'Blitz',
        'Daumen',
        'Euro',
        'Flagge',
        'Flamme',
        'Foto',
        'Handschlag',
        'Haus',
        'Herz',
        'Info',
        'Kalender',
        'Karte',
        'Klassen',
        'Krone',
        'Lineal',
        'LKW',
        'Medaille',
        'Megafon',
        'Nummer',
        'Ort',
        'Person',
        'Personen',
        'Pokal',
        'Prozent',
        'Runden',
        'Stern',
        'Stoppuhr',
        'Strecke',
        'Tacho',
        'Ticket',
        'Treibstoff',
        'Uhr',
        'Werkzeug',
        'Wimpel',
        'Zahnrad',
        'Zelt',
        'Ziel',
      ]
    > &
      Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'address.address': AddressAddress;
      'class-group.class-group': ClassGroupClassGroup;
      'color.color': ColorColor;
      'contact.contact': ContactContact;
      'stat.stat': StatStat;
    }
  }
}
