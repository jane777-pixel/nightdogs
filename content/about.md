---js
const eleventyNavigation = {
    key: "About",
    order: 3
};
---

# About

Nightdogs is something

## Authors

<div class="h-card" data-author="jane">
    <h3 class="p-name">Jane Marie Bach</h3>
    
    <p class="p-note">{{ jane_note | safe }}</p>
    
    <ul>
        {% for link in jane_links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="abby">
    <h3 class="p-name">Abby Rhynold</h3>
    
    <p class="p-note">{{ abby_note | safe }}</p>

    <ul>
        {% for link in abby_links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>

</div>

<div class="h-card" data-author="adesse">
    <h3 class="p-name">Adèsse Brown</h3>
    
    <p class="p-note">{{ adesse_note | safe }}</p>

    <ul>
        {% for link in adesse_links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>

</div>

<div class="h-card" data-author="orionlw">
    <h3 class="p-name">Orion Leidl Wilson</h3>
    
    <p class="p-note">{{ orion_note | safe }}</p>
    
    <ul>
        {% for link in orion_links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="amelia">
    <h3 class="p-name">Amelia Wheeler</h3>
    
    <p class="p-note">{{ amelia_note | safe }}</p>

    <ul>
        {% for link in amelia_links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>

</div>
