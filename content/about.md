---js
const eleventyNavigation = {
    key: "About",
    order: 3
};
---

# About

Nightdogs are hotdogs that you eat in the middle of the night

## Authors

<div class="h-card" data-author="jane">
    <h3 class="p-name">{{ authors.jane.name }}</h3>
    <p class="p-note">{{ authors.jane.note | safe }}</p>
    <ul>
        {% for link in authors.jane.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="abby">
    <h3 class="p-name">{{ authors.abby.name }}</h3>
    <p class="p-note">{{ authors.abby.note | safe }}</p>
    <ul>
        {% for link in authors.abby.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="adesse">
    <h3 class="p-name">{{ authors.adesse.name }}</h3>
    <p class="p-note">{{ authors.adesse.note | safe }}</p>
    <ul>
        {% for link in authors.adesse.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="orionlw">
    <h3 class="p-name">{{ authors.orionlw.name }}</h3>
    <p class="p-note">{{ authors.orionlw.note | safe }}</p>
    <ul>
        {% for link in authors.orionlw.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="amelia">
    <h3 class="p-name">{{ authors.amelia.name }}</h3>
    <p class="p-note">{{ authors.amelia.note | safe }}</p>
    <ul>
        {% for link in authors.amelia.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="nic">
    <h3 class="p-name">{{ authors.nic.name }}</h3>
    <p class="p-note">{{ authors.nic.note | safe }}</p>
    <ul>
        {% for link in authors.nic.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>
