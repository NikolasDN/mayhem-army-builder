import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Core interfaces for BattleScribe data structure
export interface BattleScribeCatalogue {
  id: string;
  revision: number;
  gameSystemId: string;
  gameSystemRevision: number;
  battleScribeVersion: string;
  name: string;
  authorContact: string;
  authorUrl: string;
  entries: BattleScribeEntry[];
  entryGroups: BattleScribeEntryGroup[];
  rules: BattleScribeRule[];
  profiles: BattleScribeProfile[];
}

export interface BattleScribeEntry {
  id: string;
  name: string;
  points: number;
  type: string;
  categoryId: string;
  minSelections: number;
  maxSelections: number;
  minPoints: number;
  maxPoints: number;
  minInRoster: number;
  maxInRoster: number;
  collective: boolean;
  hidden: boolean;
  page: number;
  book?: string;
  profiles: BattleScribeProfile[];
  rules: BattleScribeRule[];
  links: BattleScribeLink[];
  entries: BattleScribeEntry[];
  entryGroups: BattleScribeEntryGroup[];
  modifiers: BattleScribeModifier[];
  linkedEntries: BattleScribeEntry[];
  linkedEntryGroups: BattleScribeEntryGroup[];
}

export interface BattleScribeProfile {
  id: string;
  profileTypeId: string;
  name: string;
  hidden: boolean;
  page: number;
  book?: string;
  characteristics: BattleScribeCharacteristic[];
  modifiers: BattleScribeModifier[];
}

export interface BattleScribeCharacteristic {
  id: string;
  name: string;
  value: string;
}

export interface BattleScribeRule {
  id: string;
  name: string;
  description: string;
  hidden: boolean;
  page: number;
  book?: string;
}

export interface BattleScribeEntryGroup {
  id: string;
  name: string;
  hidden: boolean;
  page: number;
  book?: string;
  entries: BattleScribeEntry[];
  entryGroups: BattleScribeEntryGroup[];
  rules: BattleScribeRule[];
  profiles: BattleScribeProfile[];
  modifiers: BattleScribeModifier[];
}

export interface BattleScribeLink {
  id: string;
  targetId: string;
  linkType: string;
  modifiers: BattleScribeModifier[];
}

export interface BattleScribeModifier {
  id: string;
  type: string;
  field: string;
  value: string;
  conditions: BattleScribeCondition[];
}

export interface BattleScribeCondition {
  id: string;
  type: string;
  field: string;
  scope: string;
  value: string;
  percentValue: boolean;
  shared: boolean;
  includeChildSelections: boolean;
  includeChildForgeWorlds: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BattleScribeService {
  constructor(private http: HttpClient) {}

  loadCatalogue(): Observable<BattleScribeCatalogue> {
    return this.http.get('assets/data/MayhemBattleChest.cat', { 
      responseType: 'text' 
    }).pipe(
      map(xmlString => {
        console.log('Received XML length:', xmlString.length);
        console.log('First 100 chars:', xmlString.substring(0, 100));
        return this.parseCatalogueXml(xmlString);
      })
    );
  }

  loadGameSystem(): Observable<any> {
    return this.http.get('assets/data/MayhemBattleChest.gst', { 
      responseType: 'text' 
    }).pipe(
      map(xmlString => this.parseGameSystemXml(xmlString))
    );
  }

  loadDataIndex(): Observable<any> {
    return this.http.get('assets/data/index.xml', { 
      responseType: 'text' 
    }).pipe(
      map(xmlString => this.parseDataIndexXml(xmlString))
    );
  }

  private parseCatalogueXml(xmlString: string): BattleScribeCatalogue {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent);
      throw new Error('XML parsing failed: ' + parseError.textContent);
    }
    
    // Try to find the catalogue element
    let catalogue = xmlDoc.querySelector('catalogue');
    
    if (!catalogue) {
      // Try getting all elements and find the one with local name 'catalogue'
      const allElements = xmlDoc.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.localName === 'catalogue') {
          catalogue = element;
          break;
        }
      }
    }
    
    if (catalogue) {
      return this.parseCatalogue(catalogue);
    }
    
    // If still not found, try the document element directly
    if (xmlDoc.documentElement && xmlDoc.documentElement.localName === 'catalogue') {
      return this.parseCatalogue(xmlDoc.documentElement);
    }
    
    throw new Error('Invalid catalogue XML format');
  }

  private parseGameSystemXml(xmlString: string): any {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Try different approaches to find the gameSystem element
    let gameSystem = xmlDoc.querySelector('gameSystem');
    if (!gameSystem) {
      // Try getting all elements and find the one with local name 'gameSystem'
      const allElements = xmlDoc.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.localName === 'gameSystem') {
          gameSystem = element;
          break;
        }
      }
    }
    
    if (gameSystem) {
      return this.parseGameSystem(gameSystem);
    }
    
    throw new Error('Invalid game system XML format');
  }

  private parseDataIndexXml(xmlString: string): any {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Try different approaches to find the dataIndex element
    let dataIndex = xmlDoc.querySelector('dataIndex');
    if (!dataIndex) {
      // Try getting all elements and find the one with local name 'dataIndex'
      const allElements = xmlDoc.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.localName === 'dataIndex') {
          dataIndex = element;
          break;
        }
      }
    }
    
    if (dataIndex) {
      return this.parseDataIndex(dataIndex);
    }
    
    throw new Error('Invalid data index XML format');
  }

  private parseCatalogue(catalogueElement: Element): BattleScribeCatalogue {
    const globalRules = this.parseRules(this.querySelectorAllNS(catalogueElement, 'rule'));
    
    // Parse all entry groups first
    const allEntryGroups = this.parseEntryGroups(this.querySelectorAllNS(catalogueElement, 'entryGroup'), globalRules, undefined, undefined, catalogueElement);
    
    // First pass: parse all entries without linked entries
    const initialEntries = this.parseEntriesInitial(this.querySelectorAllNS(catalogueElement, 'entry'), globalRules);
    
    // Second pass: parse entries with linked entries and entry groups resolved
    const finalEntries = this.parseEntries(this.querySelectorAllNS(catalogueElement, 'entry'), globalRules, initialEntries, allEntryGroups);
    
    // Create a map of all entries by ID for quick lookup
    const allEntriesMap = new Map<string, BattleScribeEntry>();
    finalEntries.forEach(entry => allEntriesMap.set(entry.id, entry));
    
    // Update entry groups with resolved entries
    const resolvedEntryGroups = allEntryGroups.map(group => ({
      ...group,
      entries: group.entries.map(entry => allEntriesMap.get(entry.id) || entry)
    }));
    
    return {
      id: catalogueElement.getAttribute('id') || '',
      revision: parseInt(catalogueElement.getAttribute('revision') || '0'),
      gameSystemId: catalogueElement.getAttribute('gameSystemId') || '',
      gameSystemRevision: parseInt(catalogueElement.getAttribute('gameSystemRevision') || '0'),
      battleScribeVersion: catalogueElement.getAttribute('battleScribeVersion') || '',
      name: catalogueElement.getAttribute('name') || '',
      authorContact: catalogueElement.getAttribute('authorContact') || '',
      authorUrl: catalogueElement.getAttribute('authorUrl') || '',
      entries: finalEntries,
      entryGroups: resolvedEntryGroups,
      rules: globalRules,
      profiles: this.parseProfiles(this.querySelectorAllNS(catalogueElement, 'profile'))
    };
  }

  private parseGameSystem(gameSystemElement: Element): any {
    // Implement game system parsing if needed
    return {
      id: gameSystemElement.getAttribute('id') || '',
      revision: parseInt(gameSystemElement.getAttribute('revision') || '0'),
      battleScribeVersion: gameSystemElement.getAttribute('battleScribeVersion') || '',
      name: gameSystemElement.getAttribute('name') || '',
      authorContact: gameSystemElement.getAttribute('authorContact') || '',
      authorUrl: gameSystemElement.getAttribute('authorUrl') || '',
      // Add more game system specific parsing as needed
    };
  }

  private parseDataIndex(dataIndexElement: Element): any {
    return {
      battleScribeVersion: dataIndexElement.getAttribute('battleScribeVersion') || '',
      name: dataIndexElement.getAttribute('name') || '',
      dataIndexEntries: this.parseDataIndexEntries(dataIndexElement.querySelectorAll('dataIndexEntry'))
    };
  }

  private parseDataIndexEntries(entries: NodeListOf<Element>): any[] {
    return Array.from(entries).map(entry => ({
      filePath: entry.getAttribute('filePath') || '',
      dataType: entry.getAttribute('dataType') || '',
      dataId: entry.getAttribute('dataId') || '',
      dataName: entry.getAttribute('dataName') || '',
      dataBattleScribeVersion: entry.getAttribute('dataBattleScribeVersion') || '',
      dataRevision: parseInt(entry.getAttribute('dataRevision') || '0')
    }));
  }

  private parseEntriesInitial(entries: NodeListOf<Element>, globalRules: BattleScribeRule[]): BattleScribeEntry[] {
    return Array.from(entries).map(entry => this.parseEntryInitial(entry, globalRules));
  }

  private parseEntries(entries: NodeListOf<Element>, globalRules: BattleScribeRule[], allEntries: BattleScribeEntry[], allEntryGroups: BattleScribeEntryGroup[]): BattleScribeEntry[] {
    return Array.from(entries).map(entry => this.parseEntry(entry, globalRules, allEntries, allEntryGroups));
  }

  private parseEntryInitial(entryElement: Element, globalRules: BattleScribeRule[]): BattleScribeEntry {
    const links = this.parseLinks(this.querySelectorAllNS(entryElement, 'link'));
    const ruleLinks = links.filter(link => link.linkType === 'rule');
    
    // Resolve linked rules
    const linkedRules = ruleLinks.map(link => {
      const rule = globalRules.find(r => r.id === link.targetId);
      if (!rule) {
        console.warn(`Rule not found for targetId: ${link.targetId}`);
      }
      return rule || { id: link.targetId, name: 'Unknown Rule', description: 'Rule not found', hidden: false, page: 0 };
    });
    
    // Combine direct rules and linked rules
    const directRules = this.parseRules(this.querySelectorAllNS(entryElement, 'rule'));
    const allRules = [...directRules, ...linkedRules];
    
    return {
      id: entryElement.getAttribute('id') || '',
      name: entryElement.getAttribute('name') || '',
      points: parseFloat(entryElement.getAttribute('points') || '0'),
      type: entryElement.getAttribute('type') || '',
      categoryId: entryElement.getAttribute('categoryId') || '',
      minSelections: parseInt(entryElement.getAttribute('minSelections') || '0'),
      maxSelections: parseInt(entryElement.getAttribute('maxSelections') || '-1'),
      minPoints: parseFloat(entryElement.getAttribute('minPoints') || '0'),
      maxPoints: parseFloat(entryElement.getAttribute('maxPoints') || '-1'),
      minInRoster: parseInt(entryElement.getAttribute('minInRoster') || '0'),
      maxInRoster: parseInt(entryElement.getAttribute('maxInRoster') || '-1'),
      collective: entryElement.getAttribute('collective') === 'true',
      hidden: entryElement.getAttribute('hidden') === 'true',
      page: parseInt(entryElement.getAttribute('page') || '0'),
      book: entryElement.getAttribute('book') || undefined,
      profiles: this.parseProfiles(this.querySelectorAllNS(entryElement, 'profile')),
      rules: allRules,
      links: links,
              entries: this.parseEntriesInitial(this.querySelectorAllNS(entryElement, 'entry'), globalRules),
        entryGroups: this.parseEntryGroups(this.querySelectorAllNS(entryElement, 'entryGroup'), globalRules, undefined, undefined, undefined),
        modifiers: this.parseModifiers(this.querySelectorAllNS(entryElement, 'modifier')),
        linkedEntries: [],
        linkedEntryGroups: []
    };
  }

  private parseEntry(entryElement: Element, globalRules: BattleScribeRule[], allEntries: BattleScribeEntry[], allEntryGroups: BattleScribeEntryGroup[]): BattleScribeEntry {
    const links = this.parseLinks(this.querySelectorAllNS(entryElement, 'link'));
    const ruleLinks = links.filter(link => link.linkType === 'rule');
    const entryLinks = links.filter(link => link.linkType === 'entry');
    const entryGroupLinks = links.filter(link => link.linkType === 'entry group');
    
    // Resolve linked rules
    const linkedRules = ruleLinks.map(link => {
      const rule = globalRules.find(r => r.id === link.targetId);
      if (!rule) {
        console.warn(`Rule not found for targetId: ${link.targetId}`);
      }
      return rule || { id: link.targetId, name: 'Unknown Rule', description: 'Rule not found', hidden: false, page: 0 };
    });
    
        // Resolve linked entries
    const linkedEntries = entryLinks.map(link => {
      const entry = allEntries.find(e => e.id === link.targetId);
      if (!entry) {
        console.warn(`Entry not found for targetId: ${link.targetId}`);
      }
      return entry || { 
        id: link.targetId, 
        name: 'Unknown Entry', 
        points: 0, 
        type: 'unknown', 
        categoryId: '', 
        minSelections: 0, 
        maxSelections: -1, 
        minPoints: 0, 
        maxPoints: -1, 
        minInRoster: 0, 
        maxInRoster: -1, 
        collective: false, 
        hidden: false, 
        page: 0, 
        profiles: [], 
        rules: [], 
        links: [], 
        entries: [], 
        entryGroups: [], 
        modifiers: [],
        linkedEntries: [],
        linkedEntryGroups: []
      };
    });

    // Resolve linked entry groups
    const linkedEntryGroups = entryGroupLinks.map(link => {
      const entryGroup = allEntryGroups.find(eg => eg.id === link.targetId);
      if (!entryGroup) {
        console.warn(`Entry group not found for targetId: ${link.targetId}`);
      }
      return entryGroup || { 
        id: link.targetId, 
        name: 'Unknown Entry Group', 
        hidden: false, 
        page: 0, 
        entries: [], 
        entryGroups: [], 
        rules: [], 
        profiles: [], 
        modifiers: []
      };
    });
    
    // Combine direct rules and linked rules
    const directRules = this.parseRules(this.querySelectorAllNS(entryElement, 'rule'));
    const allRules = [...directRules, ...linkedRules];
    

    
    return {
      id: entryElement.getAttribute('id') || '',
      name: entryElement.getAttribute('name') || '',
      points: parseFloat(entryElement.getAttribute('points') || '0'),
      type: entryElement.getAttribute('type') || '',
      categoryId: entryElement.getAttribute('categoryId') || '',
      minSelections: parseInt(entryElement.getAttribute('minSelections') || '0'),
      maxSelections: parseInt(entryElement.getAttribute('maxSelections') || '-1'),
      minPoints: parseFloat(entryElement.getAttribute('minPoints') || '0'),
      maxPoints: parseFloat(entryElement.getAttribute('maxPoints') || '-1'),
      minInRoster: parseInt(entryElement.getAttribute('minInRoster') || '0'),
      maxInRoster: parseInt(entryElement.getAttribute('maxInRoster') || '-1'),
      collective: entryElement.getAttribute('collective') === 'true',
      hidden: entryElement.getAttribute('hidden') === 'true',
      page: parseInt(entryElement.getAttribute('page') || '0'),
      book: entryElement.getAttribute('book') || undefined,
      profiles: this.parseProfiles(this.querySelectorAllNS(entryElement, 'profile')),
      rules: allRules,
      links: links,
              entries: this.parseEntries(this.querySelectorAllNS(entryElement, 'entry'), globalRules, allEntries, allEntryGroups),
        entryGroups: this.parseEntryGroups(this.querySelectorAllNS(entryElement, 'entryGroup'), globalRules, allEntries, allEntryGroups, undefined),
        modifiers: this.parseModifiers(this.querySelectorAllNS(entryElement, 'modifier')),
        linkedEntries: linkedEntries,
        linkedEntryGroups: linkedEntryGroups
    };
  }

  private parseProfiles(profiles: NodeListOf<Element>): BattleScribeProfile[] {
    return Array.from(profiles).map(profile => ({
      id: profile.getAttribute('id') || '',
      profileTypeId: profile.getAttribute('profileTypeId') || '',
      name: profile.getAttribute('name') || '',
      hidden: profile.getAttribute('hidden') === 'true',
      page: parseInt(profile.getAttribute('page') || '0'),
      book: profile.getAttribute('book') || undefined,
      characteristics: this.parseCharacteristics(this.querySelectorAllNS(profile, 'characteristic')),
      modifiers: this.parseModifiers(this.querySelectorAllNS(profile, 'modifier'))
    }));
  }

  private parseCharacteristics(characteristics: NodeListOf<Element>): BattleScribeCharacteristic[] {
    return Array.from(characteristics).map(char => ({
      id: char.getAttribute('characteristicId') || '',
      name: char.getAttribute('name') || '',
      value: char.getAttribute('value') || ''
    }));
  }

  private parseRules(rules: NodeListOf<Element>): BattleScribeRule[] {
    return Array.from(rules).map(rule => ({
      id: rule.getAttribute('id') || '',
      name: rule.getAttribute('name') || '',
      description: rule.textContent || '',
      hidden: rule.getAttribute('hidden') === 'true',
      page: parseInt(rule.getAttribute('page') || '0'),
      book: rule.getAttribute('book') || undefined
    }));
  }

  private parseEntryGroups(entryGroups: NodeListOf<Element>, globalRules: BattleScribeRule[], allEntries?: BattleScribeEntry[], allEntryGroups?: BattleScribeEntryGroup[], catalogueElement?: Element): BattleScribeEntryGroup[] {
    return Array.from(entryGroups).map(group => {
      // Parse links to resolve linked entries
      const links = this.parseLinks(this.querySelectorAllNS(group, 'link'));
      const entryLinks = links.filter(link => link.linkType === 'entry');
      
      // Resolve linked entries
      const linkedEntries = entryLinks.map(link => {
        const entry = allEntries?.find(e => e.id === link.targetId);
        if (!entry) {
          console.warn(`Entry not found for targetId: ${link.targetId}`);
          // Try to find the entry in the XML to get its name
          let entryName = 'Unknown Entry';
          if (catalogueElement) {
            const entryElements = this.querySelectorAllNS(catalogueElement, 'entry');
            const entryElement = Array.from(entryElements).find((el: Element) => el.getAttribute('id') === link.targetId);
            if (entryElement) {
              entryName = entryElement.getAttribute('name') || 'Unknown Entry';
            }
          }
          return { 
            id: link.targetId, 
            name: entryName, 
            points: 0, 
            type: 'unknown', 
            categoryId: '', 
            minSelections: 0, 
            maxSelections: -1, 
            minPoints: 0, 
            maxPoints: -1, 
            minInRoster: 0, 
            maxInRoster: -1, 
            collective: false, 
            hidden: false, 
            page: 0, 
            profiles: [], 
            rules: [], 
            links: [], 
            entries: [], 
            entryGroups: [], 
            modifiers: [],
            linkedEntries: [],
            linkedEntryGroups: []
          };
        }
        return entry;
      });

      // Combine direct entries and linked entries
      const directEntries = allEntries ? this.parseEntries(this.querySelectorAllNS(group, 'entry'), globalRules, allEntries, allEntryGroups || []) : this.parseEntriesInitial(this.querySelectorAllNS(group, 'entry'), globalRules);
      const allGroupEntries = [...directEntries, ...linkedEntries];

      return {
        id: group.getAttribute('id') || '',
        name: group.getAttribute('name') || '',
        hidden: group.getAttribute('hidden') === 'true',
        page: parseInt(group.getAttribute('page') || '0'),
        book: group.getAttribute('book') || undefined,
        entries: allGroupEntries,
        entryGroups: this.parseEntryGroups(this.querySelectorAllNS(group, 'entryGroup'), globalRules, allEntries, allEntryGroups, catalogueElement),
        rules: this.parseRules(this.querySelectorAllNS(group, 'rule')),
        profiles: this.parseProfiles(this.querySelectorAllNS(group, 'profile')),
        modifiers: this.parseModifiers(this.querySelectorAllNS(group, 'modifier'))
      };
    });
  }

  private parseLinks(links: NodeListOf<Element>): BattleScribeLink[] {
    return Array.from(links).map(link => ({
      id: link.getAttribute('id') || '',
      targetId: link.getAttribute('targetId') || '',
      linkType: link.getAttribute('linkType') || '',
      modifiers: this.parseModifiers(this.querySelectorAllNS(link, 'modifier'))
    }));
  }

  private parseModifiers(modifiers: NodeListOf<Element>): BattleScribeModifier[] {
    return Array.from(modifiers).map(modifier => ({
      id: modifier.getAttribute('id') || '',
      type: modifier.getAttribute('type') || '',
      field: modifier.getAttribute('field') || '',
      value: modifier.getAttribute('value') || '',
      conditions: this.parseConditions(this.querySelectorAllNS(modifier, 'condition'))
    }));
  }

  private parseConditions(conditions: NodeListOf<Element>): BattleScribeCondition[] {
    return Array.from(conditions).map(condition => ({
      id: condition.getAttribute('id') || '',
      type: condition.getAttribute('type') || '',
      field: condition.getAttribute('field') || '',
      scope: condition.getAttribute('scope') || '',
      value: condition.getAttribute('value') || '',
      percentValue: condition.getAttribute('percentValue') === 'true',
      shared: condition.getAttribute('shared') === 'true',
      includeChildSelections: condition.getAttribute('includeChildSelections') === 'true',
      includeChildForgeWorlds: condition.getAttribute('includeChildForgeWorlds') === 'true'
    }));
  }

  // Helper method for namespace-aware querySelectorAll
  private querySelectorAllNS(element: Element, selector: string): NodeListOf<Element> {
    // Try with normal selector first
    const result = element.querySelectorAll(selector);
    if (result.length > 0) {
      return result;
    }
    
    // If no results, try to find elements by local name
    const allElements = element.getElementsByTagName('*');
    const matchingElements: Element[] = [];
    
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.localName === selector) {
        matchingElements.push(el);
      }
    }
    
    // Create a NodeList-like object
    const nodeList = {
      length: matchingElements.length,
      item: (index: number) => matchingElements[index],
      [Symbol.iterator]: function* () {
        for (let i = 0; i < matchingElements.length; i++) {
          yield matchingElements[i];
        }
      }
    } as NodeListOf<Element>;
    
    // Add numeric indexing
    for (let i = 0; i < matchingElements.length; i++) {
      (nodeList as any)[i] = matchingElements[i];
    }
    
    return nodeList;
  }

  // Utility methods for working with the parsed data
  getEntriesByType(catalogue: BattleScribeCatalogue, type: string): BattleScribeEntry[] {
    return catalogue.entries.filter(entry => entry.type === type);
  }

  getEntriesByCategory(catalogue: BattleScribeCatalogue, categoryId: string): BattleScribeEntry[] {
    return catalogue.entries.filter(entry => entry.categoryId === categoryId);
  }

  getEntryById(catalogue: BattleScribeCatalogue, id: string): BattleScribeEntry | undefined {
    return catalogue.entries.find(entry => entry.id === id);
  }

  getProfileById(catalogue: BattleScribeCatalogue, id: string): BattleScribeProfile | undefined {
    return catalogue.profiles.find(profile => profile.id === id);
  }

  getRuleById(catalogue: BattleScribeCatalogue, id: string): BattleScribeRule | undefined {
    return catalogue.rules.find(rule => rule.id === id);
  }
}
